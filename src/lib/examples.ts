export interface Example {
  label: string;
  text: string;
}

export interface ExampleCategory {
  name: string;
  icon: string; // emoji for tab label
  examples: Example[];
}

export const EXAMPLE_CATEGORIES: ExampleCategory[] = [
  {
    name: 'Social Science',
    icon: '\u{1F465}',
    examples: [
      {
        label: 'Sociology',
        text: 'The dialectical interplay between structure and agency manifests in the habituated practices of social actors, whose dispositional tendencies are simultaneously constituted by and constitutive of the field-specific logics that govern symbolic capital accumulation.',
      },
      {
        label: 'Political Science',
        text: 'The hegemonic consolidation of neoliberal governance frameworks has precipitated a systematic erosion of deliberative democratic norms, whereby the discursive construction of market rationality supplants substantive participatory engagement in the public sphere.',
      },
      {
        label: 'Psychology',
        text: 'Metacognitive monitoring deficits in executive function, particularly with respect to inhibitory control and cognitive flexibility, have been shown to moderate the relationship between working memory capacity and task-switching performance in dual-task paradigms.',
      },
    ],
  },
  {
    name: 'Business',
    icon: '\u{1F4BC}',
    examples: [
      {
        label: 'Management',
        text: 'Leveraging synergistic cross-functional alignments, we can operationalize a paradigm shift toward customer-centric value propositions that drive sustainable competitive advantage through iterative optimization of touchpoint experiences.',
      },
      {
        label: 'Finance',
        text: 'The stochastic volatility model, incorporating mean-reverting variance processes with jump diffusion components, provides superior out-of-sample hedging performance relative to the canonical Black-Scholes framework under conditions of pronounced leptokurtosis.',
      },
      {
        label: 'Marketing',
        text: 'Brand equity erosion attributable to the commoditization of digitally-mediated consumer touchpoints necessitates a paradigmatic recalibration of omnichannel attribution models toward probabilistic multi-touch frameworks.',
      },
    ],
  },
  {
    name: 'Humanities',
    icon: '\u{1F4DA}',
    examples: [
      {
        label: 'Philosophy',
        text: 'The epistemological ramifications of post-structuralist deconstruction necessitate a fundamental reconceptualization of the ontological status of textual meaning, whereby the signifier-signified relationship is revealed as inherently unstable and contingent upon the differance that perpetually defers presence.',
      },
      {
        label: 'Literary Theory',
        text: 'The palimpsestic intertextuality of the postmodern novel engenders a recursive destabilization of narrative authority, foregrounding the always-already mediated nature of textual production and the constitutive role of readerly praxis in the co-construction of meaning.',
      },
      {
        label: 'History',
        text: 'The longue durée analysis of proto-capitalist accumulation regimes reveals the path-dependent articulation of mercantilist extractive institutions with emergent bourgeois class formations, precipitating the dialectical transformation of feudal modes of production.',
      },
    ],
  },
  {
    name: 'STEM',
    icon: '\u{1F52C}',
    examples: [
      {
        label: 'Biology',
        text: 'The pleiotropic effects of CRISPR-mediated perturbation of the Wnt/\u03B2-catenin signaling cascade demonstrate context-dependent epistatic interactions with the Hedgehog pathway, modulating downstream transcriptional programs governing cellular fate determination in organoid systems.',
      },
      {
        label: 'Computer Science',
        text: 'The amortized computational complexity of the proposed differentially-private federated learning algorithm achieves asymptotically optimal convergence rates under heterogeneous data distributions, leveraging gradient compression with stochastic quantization.',
      },
      {
        label: 'Physics',
        text: 'The non-perturbative vacuum structure of quantum chromodynamics, characterized by topologically non-trivial gauge field configurations including instantons and merons, gives rise to the axial anomaly and the consequent breaking of the classical U(1) chiral symmetry.',
      },
    ],
  },
  {
    name: 'Medicine',
    icon: '\u{2695}\u{FE0F}',
    examples: [
      {
        label: 'Clinical Research',
        text: 'The multi-arm adaptive platform trial demonstrated non-inferiority of the novel mRNA-based therapeutic in the intention-to-treat population, with a hazard ratio for the composite endpoint of cardiovascular death or hospitalization of 0.83 (95% CI: 0.71-0.97; p=0.018).',
      },
      {
        label: 'Neuroscience',
        text: 'Optogenetic interrogation of ventral tegmental area dopaminergic projections to the nucleus accumbens shell reveals dissociable roles for D1R-expressing and D2R-expressing medium spiny neurons in the encoding of reward prediction errors during Pavlovian conditioning.',
      },
      {
        label: 'Public Health',
        text: 'The intersectionality framework applied to social determinants of health outcomes reveals multiplicative rather than additive effects of racialized socioeconomic stratification on morbidity differentials, mediated through allostatic load pathways.',
      },
    ],
  },
];
