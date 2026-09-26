import { ShieldCheck, Cpu, Lock, Network } from "lucide-react";

/**
 * Deliverable 4: Production Hardening Roadmap Pillars
 */
export const HARDENING_PILLARS = [
  {
    title: "1. Formal Verification of Validator Rules (OPA / Rego)",
    icon: ShieldCheck,
    description:
      "Migrate compliance and capacity checks from LLM prompting to deterministic policy engines (Open Policy Agent / Rego). Provides mathematical guarantees against compliance bypasses and prevents prompt-injection attacks.",
    impact: "Zero-hallucination compliance certification for SOC2 / PCI-DSS audits."
  },
  {
    title: "2. eBPF-Enforced Execution Sandboxing",
    icon: Cpu,
    description:
      "Execute canary tests inside ephemeral AWS Firecracker microVMs monitored by eBPF syscall probes (Cilium / Tetragon) to guarantee zero unintended network egress or lateral movement during staging.",
    impact: "Hermetic sandbox isolation with sub-millisecond execution verification."
  },
  {
    title: "3. Multi-Party Threshold Cryptography (MPC)",
    icon: Lock,
    description:
      "Implement Shamir's Secret Sharing (2-of-3 threshold signatures) requiring concurrent sign-off from VP of Security, VP of Operations, and Legal Counsel for infrastructure changes exceeding $100,000.",
    impact: "Eliminates single point of failure in high-stakes human approval."
  },
  {
    title: "4. Distributed Kafka Swarm & Kubernetes Auto-Scaling",
    icon: Network,
    description:
      "Decouple the 4 agent services into independent containerized pods reading from Apache Kafka partitioned topics (e.g. 10x Retriever pods for I/O, 2x Planner pods for compute) with Postgres state persistence.",
    impact: "Horizontal scale to 10,000+ enterprise incidents daily with 99.999% availability."
  }
];

