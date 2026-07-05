vf_constructors := module:
    weapon_profile := class:
        Name:string
        Damage:int
        Tags:[]string = array{}

    ranked_profile := class(weapon_profile):
        Rank:int = 0
        Tags<override>:[]string = array{}

    MakeProfile<constructor>(Name:string, Damage:int) := weapon_profile:
        Name := Name
        Damage := Damage
        Tags := array{"default", "profile"}

    MakeRankedProfile<constructor>(Name:string, Damage:int, Rank:int) := ranked_profile:
        Rank := Rank
        Tags := array{"ranked", "constructor"}
        MakeProfile<constructor>(Name, Damage)

    CopyProfile<constructor>(Source:weapon_profile) := weapon_profile:
        Name := Source.Name
        Damage := Source.Damage
        Tags := Source.Tags

    UseConstructors():int =
        Base := MakeProfile("Pulse", 32)
        Ranked := MakeRankedProfile("Burst", 45, 2)
        Copy := CopyProfile(Base)
        Base.Damage + Ranked.Rank + Copy.Damage
