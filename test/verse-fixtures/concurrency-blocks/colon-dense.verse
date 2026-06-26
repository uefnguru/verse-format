using {/Verse.org/Simulation}

vf_concurrency_blocks := module:
    RunAll()<suspends>:void =
        sync:
            Sleep(0.0)
            Sleep(0.0)

    RunRace()<suspends>:void =
        race:
            Sleep(0.0)
            Sleep(0.1)

    RunRush()<suspends>:void =
        rush:
            Sleep(0.0)
            Sleep(0.1)

    RunBackground()<suspends>:void =
        branch:
            Sleep(0.0)
        spawn:
            Background()

    Background()<suspends>:void =
        Sleep(0.0)
