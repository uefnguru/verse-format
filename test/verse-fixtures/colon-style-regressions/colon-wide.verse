using { /Fortnite.com/Devices }
using { /Fortnite.com/Devices/CreativeAnimation }
using { /UnrealEngine.com/Temporary/Diagnostics }
using { /UnrealEngine.com/Temporary/SpatialMath }
using { /Verse.org/Simulation }

tuple_parameter_regression := module:
    test := class():
        OnBack(Args: tuple(float, float)): void =
            Print("hello")

array_return_regression := module:
    Test()<transacts>: []int =
        return array{1, 2, 3, 4,
            5, 6
        }

empty_function_regression := module:
    Test(Agent: agent): void = {}

adjacent_functions_regression := module:
    test := class(creative_device):

        OnTest((Name: string, Value: int, OldValue: int)): void =
            Print("Hello")
        OnBegin<override>()<suspends>: void =
            Print("World")

animation_call_regression := module:
    UnitVector3: vector3 = vector3:
        X := 1.0
        Y := 1.0
        Z := 1.0

    test := class():
        Animator: animation_controller

        Test(): void =
            Animator.SetAnimation(
                array{
                    RotationKeyframe(vector3{Y := 4.98, X := 0.43, Z := 5.01})
                    RotationKeyframe(vector3{Y := -5.74, X := 0.87, Z := -0.85})
                    RotationKeyframe(vector3{Y := 5.61, X := 0.18, Z := -1.56})
                    RotationKeyframe(vector3{Y := 0.0, X := 0.0, Z := 0.0})
                },
                ?Mode := animation_mode.OneShot)

        RotationKeyframe<private>(Rotation: vector3): keyframe_delta =
            keyframe_delta:
                DeltaLocation := vector3:
                DeltaRotation := MakeRotationFromYawPitchRollDegrees(Rotation.X, Rotation.Y, Rotation.Z)
                DeltaScale := UnitVector3
                Time := 0.3
