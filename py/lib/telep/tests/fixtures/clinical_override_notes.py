# -*- coding: utf-8 -*-
# flake8: noqa
"""
Contains lists of notes for testinga nd validation
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ClinicalOverrideNoteFixture:
    secondary_screening_note_raw: list[str]
    dispatcher_notes_raw: list[str]
    is_enhanced_market: bool
    should_override: bool


notes_where_dispatcher_mentions_needed_word_all_markets = [
    ClinicalOverrideNoteFixture(
        dispatcher_notes_raw=[
            "Additional Details: n/a",
            "superpubic catheter and needs to be change / infection and requesting for urinalysis / backpain /",
            "Patient info uploaded via Companion",
        ],
        secondary_screening_note_raw=[],
        is_enhanced_market=False,  # Atl
        should_override=True,
    ),
    ClinicalOverrideNoteFixture(
        dispatcher_notes_raw=[
            "Wife states patient is not eating/drinking well. Patient says he is feeling okay, he is able to get up and walk around with his canes. He is weaker than normal. Wife thinks he may be feverish. She did notice his catheter leaking some and was told by HH that if that happens it could be related to an infection. She wanted to take him to the hospital, but patient prefers DH to come out.",
            "Patient info uploaded via Companion",
            "Call-ahead Completed",
            "his wife called to let us know that her husband went to the hospital and he still there but doing ok.",
            "Wife called in on today 8/17/2023 with complaint about service received and a bill that's in question for pt. Sent to escalation. Verified PHI ",
        ],
        secondary_screening_note_raw=[],
        is_enhanced_market=False,  # Atl
        should_override=True,
    ),
    ClinicalOverrideNoteFixture(
        dispatcher_notes_raw=[
            "Sx: fatigue ,fever, chills, nausea and headache.",
            "ETA call attempted",
            "pt assigned to tele, has a catheter and her symptoms are typical of uti. needs duo team",
            "ETA call attempted",
            "Technical note for DHFU. If you see it, please ignore it!",
        ],
        secondary_screening_note_raw=[],
        is_enhanced_market=False,  # Atl
        should_override=True,
    ),
]
