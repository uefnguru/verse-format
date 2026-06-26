using { vf_shared_math }
using { vf_shared_types }
using { vf_nested_library.vf_numbers }
using { vf_nested_library.vf_records }

vf_multi_file_consumer := module:
    MakePair(Value:int):result_pair =
        result_pair{Left:=Value,Right:=AddBonus(Value)}

    SumPair(Value:int):int =
        Pair := MakePair(Value)
        Pair.Left + Pair.Right

    MakeNestedPair(Value:int):nested_result =
        nested_result{Raw:=Value,Adjusted:=AddNested(Value)}

    SumNestedPair(Value:int):int =
        Pair := MakeNestedPair(Value)
        Pair.Raw + Pair.Adjusted
