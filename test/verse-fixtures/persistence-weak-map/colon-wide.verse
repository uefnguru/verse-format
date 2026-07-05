using { /Fortnite.com/Devices }
using { /Verse.org/Simulation }

vf_player_profile := class<final><persistable>:
    Version: int = 1
    Score: int = 0

var VfProfiles: weak_map(player, vf_player_profile) = map{}

vf_persistence_weak_map := class(creative_device):
    OnBegin<override>()<suspends>: void =
        Players := GetPlayspace().GetPlayers()
        for(Player: Players):
            if(Profile := VfProfiles[Player]):
                Profile.Score
            else:
                if(set VfProfiles[Player] = vf_player_profile{}):
                    block:
