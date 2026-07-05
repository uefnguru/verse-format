using { /Fortnite.com/Devices }
using { /Verse.org/Simulation }

vf_custom_parametric_events := module:
    i_custom_event(payload_type: type) := interface:
        Subscribe<public>(Callback: type{_(:payload_type): void}): void

    custom_event(payload_type: type) := class<concrete>(i_custom_event(payload_type)):
        var Subscriptions<private>: []type{_(:payload_type): void} = array{}

        Subscribe<override>(Callback: type{_(:payload_type): void}): void =
            set Subscriptions += array{Callback}

        Emit<public>(Payload: payload_type): void =
            for(Callback: Subscriptions):
                Callback(Payload)

    custom_int_event_emitter_device := class(creative_device):
        IntEvent<private>: custom_event(int) = custom_event(int) {}

        CustomEvent<public>(): i_custom_event(int) =
            IntEvent

        EmitCustomEvent<public>(Value: int): void =
            IntEvent.Emit(Value)

    custom_int_event_subscriber_device := class(creative_device):
        @editable
        EmitterDevice: custom_int_event_emitter_device = custom_int_event_emitter_device{}

        OnBegin<override>()<suspends>: void =
            EmitterDevice.CustomEvent().Subscribe(OnEvent)
            EmitterDevice.EmitCustomEvent(42)

        OnEvent(Value: int): void =
            Print("Value received: {Value}")
