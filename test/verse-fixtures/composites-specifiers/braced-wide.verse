vf_composites_specifiers := module {
    sample_direction := enum {
        North
        South
        East
        West
    }

    sample_point := struct {
        X: float
        Y: float
        Z: float
    }

    named_thing := interface {
        GetName(): string
    }

    sample_thing := class(named_thing) {
        Name: string = "thing"
        Location: sample_point = sample_point {
            X := 1.0,
            Y := 2.0,
            Z := 3.0
        }

        GetName<override>(): string = {
            Self.Name
        }
    }

    MakePoint(): sample_point = {
        sample_point {
            X := 4.0,
            Y := 5.0,
            Z := 6.0
        }
    }

    DirectionIndex(Direction: sample_direction): int = {
        case(Direction) {
            sample_direction.North => 0
            sample_direction.South => 1
            sample_direction.East => 2
            sample_direction.West => 3
        }
    }
}
