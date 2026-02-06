import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, isStripeEnabled } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/plans';

// POST /api/stripe/checkout — create a Stripe checkout session
export async function POST() {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId || !session?.user?.email) {
    return NextResponse.json({ error: 'Sign in to upgrade' }, { status: 401 });
  }

  const proPlan = PLANS.pro;
  if (!proPlan.stripePriceId) {
    return NextResponse.json({ error: 'Pro plan not configured' }, { status: 503 });
  }

  // Get or create Stripe customer
  const user = await prisma.user.findUnique({ where: { id: userId } });
  let customerId = user?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: session.user.name || undefined,
      metadata: { userId },
    });
    customerId = customer.id;

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  // Check for existing active subscription
  const existingSub = await prisma.subscription.findUnique({
    where: { userId },
  });
  if (existingSub && existingSub.status === 'active') {
    return NextResponse.json({ error: 'Already subscribed to Pro' }, { status: 400 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: proPlan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/pricing?success=true`,
    cancel_url: `${baseUrl}/pricing?canceled=true`,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
