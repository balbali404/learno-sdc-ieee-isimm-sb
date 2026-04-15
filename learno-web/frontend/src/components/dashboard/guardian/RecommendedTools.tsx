'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import {
  Blocks,
  BrainCircuit,
  CircleCheckBig,
  Compass,
  Hand,
  MessageCircleHeart,
  X,
} from 'lucide-react';

interface RecommendedTool {
  id: string;
  title: string;
  description: string;
  purpose: string;
  detailedDescription: string;
  whyItHelps: string[];
  keyBenefits: string[];
  imageSrc: string;
  imageAlt: string;
  icon: typeof Blocks;
}

const RECOMMENDED_TOOLS: RecommendedTool[] = [
  {
    id: 'interactive-learning',
    title: 'Interactive Learning',
    description:
      'Engaging tools that transform learning into interactive experiences, helping children stay focused and actively involved.',
    purpose:
      'Improves attention and engagement for children with ADHD and learning difficulties.',
    detailedDescription:
      'Interactive learning tools transform traditional education into engaging, hands-on experiences. Instead of passively receiving information, children actively participate by controlling, experimenting, and seeing immediate results.',
    whyItHelps: [
      'Improves focus for children with ADHD',
      'Reinforces memory through action',
      'Makes learning enjoyable instead of stressful',
    ],
    keyBenefits: [
      'Active engagement',
      'Better attention span',
      'Faster understanding',
    ],
    imageSrc: '/recommended-tools/interactive-learning.jpg.jpeg',
    imageAlt: 'Interactive robotics and digital learning tools for children',
    icon: BrainCircuit,
  },
  {
    id: 'build-confidence',
    title: 'Build Confidence',
    description:
      'Simple and achievable challenges that encourage children to progress step by step.',
    purpose: 'Builds self-confidence and reduces frustration through small wins.',
    detailedDescription:
      'These tools provide small, achievable challenges that allow children to progress step by step. Each success builds a sense of accomplishment and encourages them to keep trying.',
    whyItHelps: [
      'Reduces fear of failure',
      'Encourages independence',
      'Builds self-esteem over time',
    ],
    keyBenefits: [
      'Positive reinforcement',
      'Motivation to learn',
      'Emotional growth',
    ],
    imageSrc: '/recommended-tools/build-confidence.jpg.webp',
    imageAlt: 'Confidence-building educational robotics activities',
    icon: CircleCheckBig,
  },
  {
    id: 'hands-on-exploration',
    title: 'Hands-on Exploration',
    description:
      'Learning through physical interaction, experimentation, and discovery.',
    purpose: 'Helps children who learn better through movement and touch.',
    detailedDescription:
      'Hands-on tools allow children to physically interact with their learning environment. By building, touching, and experimenting, they gain a deeper understanding of concepts.',
    whyItHelps: [
      'Ideal for kinesthetic learners',
      'Strengthens motor skills',
      'Connects theory with real-world experience',
    ],
    keyBenefits: [
      'Learning by doing',
      'Improved coordination',
      'Deeper comprehension',
    ],
    imageSrc: '/recommended-tools/hands-on-exploration.jpg.png',
    imageAlt: 'Hands-on exploration with robotics and sensory learning kits',
    icon: Hand,
  },
  {
    id: 'problem-solving',
    title: 'Problem Solving',
    description:
      'Activities that develop logical thinking and step-by-step reasoning.',
    purpose: 'Strengthens cognitive and structured problem-solving skills.',
    detailedDescription:
      'Problem-solving activities encourage children to think step by step, identify patterns, and find solutions through logic and experimentation.',
    whyItHelps: [
      'Develops critical thinking',
      'Improves sequencing skills',
      'Helps with math-related challenges',
    ],
    keyBenefits: [
      'Logical reasoning',
      'Decision-making',
      'Cognitive flexibility',
    ],
    imageSrc: '/recommended-tools/problem-solving.jpg.png',
    imageAlt: 'Problem-solving activity using educational robots',
    icon: Compass,
  },
  {
    id: 'social-interaction',
    title: 'Social Interaction',
    description:
      'Encourages communication and interaction in a safe environment.',
    purpose:
      'Supports social skill development, especially for children with autism.',
    detailedDescription:
      'These tools create opportunities for children to communicate, collaborate, and interact in a structured and safe environment.',
    whyItHelps: [
      'Supports children with autism',
      'Reduces social anxiety',
      'Encourages expression',
    ],
    keyBenefits: [
      'Communication skills',
      'Emotional understanding',
      'Cooperative learning',
    ],
    imageSrc: '/recommended-tools/social-interaction.jpg.png',
    imageAlt: 'Collaborative social interaction learning session for children',
    icon: MessageCircleHeart,
  },
  {
    id: 'structured-support',
    title: 'Structured Support',
    description:
      'Guided activities with clear steps adapted to each child\'s pace.',
    purpose: 'Provides routine and structure for better learning outcomes.',
    detailedDescription:
      'Structured tools provide clear steps and predictable routines, helping children feel secure and understand what is expected.',
    whyItHelps: [
      'Reduces confusion and anxiety',
      'Supports children who need routine',
      'Improves learning consistency',
    ],
    keyBenefits: [
      'Clear guidance',
      'Stable learning environment',
      'Better progress tracking',
    ],
    imageSrc: '/recommended-tools/structured-support.jpg.webp',
    imageAlt: 'Structured support plan using guided learning tools',
    icon: Blocks,
  },
];

export function RecommendedTools() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  const activeTool = useMemo(
    () => RECOMMENDED_TOOLS.find((tool) => tool.id === activeToolId) ?? null,
    [activeToolId],
  );

  useEffect(() => {
    if (!activeToolId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveToolId(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeToolId]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-[#2C3E50]">Recommended Learning Tools</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Carefully selected tools that support your child&apos;s learning through interactive,
              hands-on, and engaging experiences.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EBF4FF] px-3 py-2 text-xs font-semibold text-[#1D4ED8]">
            <BrainCircuit size={14} />
            Neurodiverse-friendly tools
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {RECOMMENDED_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isExpanded = activeToolId === tool.id;

          return (
            <motion.article
              key={tool.id}
              layoutId={`recommended-tool-${tool.id}`}
              transition={{ duration: 0.35, ease: MODAL_EASE }}
              className={`group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                isExpanded ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              <div className="relative aspect-[4/3] w-full bg-gray-100">
                <Image
                  src={tool.imageSrc}
                  alt={tool.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/15 to-transparent" />
              </div>

              <div className="space-y-4 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#BFDBFE] bg-[#EBF4FF] text-[#1D4ED8]">
                    <Icon size={16} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-[#2C3E50]">{tool.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{tool.description}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purpose</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{tool.purpose}</p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">Tap for full details</span>
                  <button
                    type="button"
                    onClick={() => setActiveToolId(tool.id)}
                    aria-haspopup="dialog"
                    aria-controls={`recommended-tool-dialog-${tool.id}`}
                    className="inline-flex items-center rounded-lg border border-[#BFDBFE] bg-[#EBF4FF] px-3 py-1.5 text-sm font-semibold text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE]"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </section>

      <AnimatePresence>
        {activeTool ? (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: MODAL_EASE }}
          >
            <motion.button
              type="button"
              onClick={() => setActiveToolId(null)}
              aria-label="Close detailed tool view"
              className="absolute inset-0 bg-slate-900/25"
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              transition={{ duration: 0.35, ease: MODAL_EASE }}
            />

            <div className="relative flex h-full w-full items-end justify-center p-0 sm:items-center sm:p-6">
              <motion.article
                id={`recommended-tool-dialog-${activeTool.id}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`recommended-tool-title-${activeTool.id}`}
                layoutId={`recommended-tool-${activeTool.id}`}
                onClick={(event) => event.stopPropagation()}
                className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl"
                initial={{ scale: 1, opacity: 0.98 }}
                animate={{ scale: [1, 1.05, 1], opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.4, ease: MODAL_EASE, times: [0, 0.55, 1] }}
              >
                <div className="relative h-56 w-full bg-slate-100 sm:h-72">
                  <Image
                    src={activeTool.imageSrc}
                    alt={activeTool.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover"
                    priority
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-900/35 to-transparent" />

                  <button
                    type="button"
                    onClick={() => setActiveToolId(null)}
                    className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <motion.div
                  key={activeTool.id}
                  className="overflow-y-auto p-5 sm:p-6"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3, delay: 0.1, ease: MODAL_EASE }}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#BFDBFE] bg-[#EBF4FF] text-[#1D4ED8]">
                      <activeTool.icon size={18} />
                    </span>
                    <div>
                      <h3
                        id={`recommended-tool-title-${activeTool.id}`}
                        className="text-2xl font-semibold text-[#2C3E50]"
                      >
                        {activeTool.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {activeTool.detailedDescription}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Why this helps
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{activeTool.purpose}</p>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <h4 className="text-sm font-semibold text-[#2C3E50]">Why it helps</h4>
                      <ul className="mt-3 space-y-2">
                        {activeTool.whyItHelps.map((point) => (
                          <li key={point} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#2563EB]" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <h4 className="text-sm font-semibold text-[#2C3E50]">Key benefits</h4>
                      <ul className="mt-3 space-y-2">
                        {activeTool.keyBenefits.map((benefit) => (
                          <li
                            key={benefit}
                            className="flex items-start gap-2 text-sm leading-relaxed text-slate-700"
                          >
                            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveToolId(null)}
                      className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.article>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
