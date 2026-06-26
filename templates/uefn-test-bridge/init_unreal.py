"""Auto-start the restricted Verse formatter test listener."""

import unreal


try:
    import verse_formatter_test_listener

    port = verse_formatter_test_listener.start_listener()
    unreal.log("[VerseFormatterTest] Auto-started listener on port %s" % port)
except Exception as exc:
    unreal.log_error("[VerseFormatterTest] Auto-start failed: %s" % exc)
