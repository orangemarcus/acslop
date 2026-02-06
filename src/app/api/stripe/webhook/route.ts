import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeEnabled } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

/** Extract period dates from subscription items (Stripe SDK v20+) */
function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  return {
    periodStart: new Date((item?.current_period_start ?? Math.floor(Date.now() / 1000)) * 1000),
    periodEnd: new Date((item?.current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 86400) * 1000),
  };
}

export async function POST(request: NextRequest) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId || !session.subscription) break;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      const { periodStart, periodEnd } = getSubscriptionPeriod(subscription);

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          status: subscription.status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
        update: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          status: subscription.status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { plan: 'pro' },
      });

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      const { periodStart, periodEnd } = getSubscriptionPeriod(subscription);

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          status: subscription.status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
        update: {
          stripePriceId: subscription.items.data[0].price.id,
          status: subscription.status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });

      // Update user plan based on subscription status
      const plan = subscription.status === 'active' || subscription.status === 'trialing'
        ? 'pro'
        : 'free';

      await prisma.user.update({
        where: { id: userId },
        data: { plan },
      });

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      await prisma.subscription.deleteMany({
        where: { userId },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { plan: 'free' },
      });

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      // In Stripe SDK v20+, subscription may be nested or an ID string
      const sub = (invoice as unknown as Record<string, unknown>).subscription;
      const subscriptionId = typeof sub === 'string' ? sub : typeof sub === 'object' && sub && 'id' in sub ? (sub as { id: string }).id : null;
      if (!subscriptionId) break;

      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: 'past_due' },
      });

      break;
    }
  }

  return NextResponse.json({ received: true });
}
