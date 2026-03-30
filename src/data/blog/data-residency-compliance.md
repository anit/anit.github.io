---
title: "Storing data in the wrong country is now a compliance violation. Here's how we built for that."
pubDatetime: 2025-10-30T00:00:00Z
tags: [compliance, architecture, data-privacy]
persona: cxo
description: "GDPR was just the start. HIPAA, India's DPDP Act, and a dozen more regulations all ask the same question: where does this data actually live? Here's how I architect for that at runtime, automatically, for every record."
---

Most engineering teams think data compliance means encryption and access controls. That was true five years ago.

It's not enough anymore.

The question regulators are now asking, and that enterprise procurement teams are writing into contracts, is simpler and harder: **where, physically, does this person's data live?** Storing EU residents' data on US servers is a GDPR violation even if the data is perfectly encrypted. Storing health data outside an approved boundary is a HIPAA problem. India's DPDP Act, which came into force in 2023, adds yet another jurisdiction with its own rules and its own regulator willing to use them.

If your answer to that question is "we think it's in the right place," you have a problem.

## The mistake most teams make

When compliance requirements land, the instinct is to add a flag. Set `data_region = "EU"` on the org record. Tell engineers to check it wherever it matters. Ship it.

This works until it doesn't. Rules change. New regulations arrive. A new engineer writes a service and doesn't know which flag to check. Six months later you have data sitting in the wrong region, and by then you're explaining yourself to a regulator or losing a deal mid-procurement.

The real mistake is embedding compliance decisions inside business logic. Once that logic is spread across twenty services, auditing it is a project in itself. Changing it is a risk event.

## A better architecture

The answer is a dedicated compliance routing service. Its only job: answer the question of where a given record should be stored, based on who the person is, where they are, and what the associated job or org requires.

No other service makes that decision independently. When personal data needs to be stored anywhere on the platform, the originating service asks the compliance layer first. It gets back a routing directive. The business logic layer never needs to know anything about vault topology or regional data sovereignty rules.

Here's what that looks like in practice:

```
  Candidate intake       Recruiter upload      Supplier feed
        │                      │                     │
        └──────────────────────┴─────────────────────┘
                               │
                               │  "store PII for person X, job Y"
                               ▼
              ┌────────────────────────────────┐
              │     Compliance Routing Layer   │
              │                                │
              │  evaluate policy for org       │
              │  check person.country          │
              │  check job.country             │
              │  resolve: → EU vault           │
              └───────────────┬────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
        ┌─────────────┐             ┌──────────────────┐
        │   EU vault  │             │     US vault     │
        │  (vendor)   │             │   (in-house)     │
        └─────────────┘             └──────────────────┘
```

Every piece of PII flows through one place. That service logs the policy evaluated, the inputs it received, and the vault it routed to. When a regulator or enterprise customer asks how you handle their data, you pull a report. You don't go digging through scattered code trying to reconstruct what was supposed to happen.

## Two vaults, one interface

Behind the routing layer sit two vault providers. For EU-region data I use a purpose-built data privacy vault with tokenization — vendors like Skyflow or Evervault are built specifically for this, certified to the standards EU enterprise legal teams actually check. For US-region data, an in-house encrypted store gives you full control end-to-end.

From the perspective of every service on the platform, these are identical. Same API. Same behavior. The routing layer knows which physical vault maps to which region. Nothing else does.

This is deliberate. Vendor lock-in on infrastructure is annoying. Vendor lock-in on the vault holding all your customers' PII is a different category of problem. Building the abstraction layer before you ever need to swap a vault out means that when you do, it's a configuration change.

## Policies as data, not code

The architecture supports multiple distinct storage policies. Things like "store everything in the US," "store in the EU only when both the person and job are EU-based," "always follow the org's home region."

None of these are code paths. Each policy is a record: a primary destination, a fallback, a set of jurisdiction-based conditions, a logical operator. Adding a new policy is a data operation. Adjusting one is a data operation. Auditing all active policies is a query.

This is what "onboarding a new regulation in days" actually looks like. When the next jurisdiction-specific law arrives (and it will), you add a policy record and wire it to the relevant org configurations. No sprint. No cross-team coordination. No regression risk across the rest of the platform.

## The design decision that actually matters to regulators

Changing an org's storage policy should not migrate existing data. Records created under a previous policy stay where they were stored. Only new records follow the updated routing.

This is intentional. Under GDPR, moving personal data between regions is itself a data processing activity with its own legal basis requirements. Automatically migrating records in response to a settings change would introduce compliance exposure, not reduce it. Storage decisions need to be immutable at the point of record creation. That's the right legal answer and the safer operational one.

## This is now a commercial question

Data residency is showing up in enterprise RFPs. It's showing up in security questionnaires. It's showing up as a checkbox that determines whether a deal closes or goes to a competitor who can answer the question.

Platforms that can *demonstrate* where data lives and why are winning deals that others aren't. That demonstration requires infrastructure, not promises. Audit logs, policy records, and vault routing history are the proof. A compliance document from your legal team is not.

The cost of building this correctly once is a fraction of what you pay explaining a violation to a regulator, or what you lose rebuilding distributed compliance logic across a platform every time the rules change.

If your platform handles PII across multiple jurisdictions and your storage decisions aren't auditable today, that's worth fixing before someone asks you to prove it.

→ [anitrai011@gmail.com](mailto:anitrai011@gmail.com)
