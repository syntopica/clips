"""Render the audit record the second pass writes."""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections import Counter

    from keep import Keep
    from mapped_row import MappedRow


def audit_lines(
    mapped: "list[MappedRow]",
    uncaptured: "list[MappedRow]",
    keeps: "list[Keep]",
    judged: int,
    in_wiki: int,
    scores: "Counter[int]",
    harvest_date: str,
    audit_date: str,
) -> list[str]:
    """Write the whole record, so the joining in `main` stays readable."""
    skips = judged - len(keeps)
    lines = [
        f"# Review-bucket audit - {harvest_date} harvest",
        "",
        f"The {len(mapped)} titles the {harvest_date} triage sent to Review, audited on {audit_date}",
        "to answer the question `TODO.md` had been carrying since the harvest: which of",
        "them are worth a batch?",
        "",
        "**The question had already changed under it.** The bucket was written before",
        "the capture-first pipeline landed, when a Review entry meant an article that",
        "had not been downloaded and might be gone by the time anyone read the line.",
        f"It is not that any more: {len(mapped) - len(uncaptured)} of the {len(mapped)} are already captured on disk in",
        f"the capture archive, and {in_wiki} of them are already cited by a wiki page. So this is not a",
        "list of things to fetch. It is a list of things already fetched and not yet",
        "read, and the classifier that filled it only ever saw their titles.",
        "",
        "## What the audit did",
        "",
        "A second pass over the clips' own extracted text rather than their titles -",
        "the first ~1600 characters of each `index.md`, which is what the title was",
        "standing in for. `codex exec` on gpt-5.5 at low reasoning, batches of 40,",
        "schema-enforced output so a dropped entry cannot pass as a verdict. Each entry",
        "got keep or skip, a 1-5 score for what the wiki gains, and a reason. The pass",
        "is `tools/review-pass/`; its README carries the commands.",
        "",
        "The pass was told to expect mostly skips, on the grounds that this bucket is",
        "what an earlier classifier was already unsure about. It returned",
        f"{len(keeps)} keeps against {skips} skips - {round(100 * len(keeps) / judged)}%, inside the band it was given, so the",
        "instruction did not simply flatten it.",
        "",
        f"## Where the {len(mapped)} went",
        "",
        "| Bucket | Count | What it means |",
        "| ------ | ----- | ------------- |",
        f"| Already in the wiki | {in_wiki} | cited by a page; nothing to decide |",
        f"| Judged this run | {judged} | captured, not yet cited |",
        f"| Never captured | {len(uncaptured)} | not on disk; see below |",
        "",
        f"Score distribution over the {judged} judged: "
        + ", ".join(f"{count} at {score}" for score, count in sorted(scores.items(), reverse=True))
        + ".",
        "",
        "## The shortlist",
        "",
        f"{len(keeps)} articles, highest value first. The clip is already on disk, so the",
        "action is `clips ingest --clip <clip_id>`, not a promote: ticking a line in",
        f"`inbox/newsletter-triage/{harvest_date}/` would re-promote something already",
        "captured. Reading order is the score.",
        "",
    ]

    current: int | None = None
    for keep in keeps:
        if keep["score"] != current:
            current = keep["score"]
            lines += [f"### Score {current}", ""]
        lines += [
            f"- [{keep['title']}]({keep['url']}) - _{keep['topic']}_",
            f"  {keep['reason']}",
            f"  `{keep['clip_id']}`",
        ]

    lines += [
        "",
        f"## The {len(uncaptured)} that were never captured",
        "",
        "No clip on disk and no wiki citation, so nothing was read to judge them. Six",
        "share one author and all thirteen are micro-SaaS idea listicles, dev-tool",
        "opinion pieces or model-hype recaps - the shape the first pass sends to Review",
        "and the second pass skips. They are listed for completeness, not as a backlog:",
        "recovering them means a fetch, and the titles do not earn one.",
        "",
    ]
    lines += [f"- [{row['title']}]({row['url']}) - _{row['topic']}_" for row in uncaptured]

    lines += [
        "",
        "## What this leaves open",
        "",
        f"The {judged} judged here were judged on their opening 1600 characters. That is far",
        "more than a title and far less than the article; a keep is a recommendation to",
        "read, and the ingest itself remains the place where a page either earns its",
        f"sources or does not. The {skips} skips are not deleted - the clips stay in",
        "`pending`, and this file is the record of why they were passed over.",
        "",
    ]

    return lines
