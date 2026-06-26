using { /Fortnite.com/Devices }
using { /Verse.org/Simulation }

vf_device_events := class(creative_device) {
    @editable
    DelaySeconds: float = 0.0

    @editable
    Button: button_device = button_device{}

    Finished: event() = event() {}
    var MaybeSubscription: ?cancelable = false

    OnBegin<override>()<suspends>: void = {
        set MaybeSubscription = option{Button.InteractedWithEvent.Subscribe(OnInteracted)}
        race {
            Sleep(DelaySeconds)
            Finished.Await()
        }
        Finished.Signal()
    }

    OnInteracted(Agent: agent): void = {
        block {}
    }
}
