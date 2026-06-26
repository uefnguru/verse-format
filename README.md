# Verse Format

Verse Format is a conservative VS Code formatter for `.verse` files. It supports Verse's common colon/indentation style and a braced block style, while preserving Verse delimiter meanings such as failable calls, construction expressions, imports, options, and specifiers.

This extension is formatter-only. It registers `.verse` files with VS Code's `verse` language id, but it does not provide syntax highlighting, snippets, a debugger, or a language server. Epic's Verse extension can provide those tools alongside this formatter.

## What It Formats

The default block style is `braced`:

```verse
mesh_collision_component<public> := class<final_super>(component) {
    OnBeginSimulation<override>(): void = {
        if(Mesh := Self.Entity.GetComponent[mesh_component]) {
            set MaybeSubscription = option{Mesh.EntityEnteredEvent.Subscribe(OnEntityEnteredEvent)}
        }
    }
}
```

Set `verseFormat.blockStyle` to `colon` to format recognized blocks with Verse's colon/indentation style:

```verse
mesh_collision_component<public> := class<final_super>(component):
    OnBeginSimulation<override>(): void =
        if(Mesh := Self.Entity.GetComponent[mesh_component]):
            set MaybeSubscription = option{Mesh.EntityEnteredEvent.Subscribe(OnEntityEnteredEvent)}
```

The formatter recognizes modules, classes, structs, interfaces, enums, function bodies, control-flow blocks, concurrency blocks, and attribute blocks such as `@editable`.

It keeps other Verse delimiter meanings intact:

- `[]` for failable calls and type conversions, such as `GetComponent[mesh_component]`
- `{}` for construction/import/options, such as `using { /Verse.org }`, `vector3{Up := 10.0}`, and `option{Value}`
- `<>` for specifiers, such as `<public>`, `<private>`, `<override>`, and `<suspends>`

It also normalizes common spacing outside comments and ordinary string text:

```verse
Print     (    "if/then else block"    )
"Location: [{X    },{   Y    },{Z +      2 + Y}]"
```

becomes:

```verse
Print("if/then else block")
"Location: [{X},{Y},{Z + 2 + Y}]"
```

## Settings

```json
{
  "verseFormat.blockStyle": "braced",
  "verseFormat.spacingStyle": "wide",
  "verseFormat.wrapMultiPropertyConstructions": true,
  "verseFormat.maxInlineConstructionProperties": 1,
  "verseFormat.maxInlineAttributeProperties": 1,
  "verseFormat.maxInlineArrayItems": 3,
  "verseFormat.finalNewline": true
}
```

`verseFormat.blockStyle` can be `braced` or `colon`. The formatter uses four spaces for indentation.

`verseFormat.spacingStyle` can be `wide` or `dense`. `wide` uses readable spacing around type annotations. `dense` follows Epic generated digest spacing more closely:

```verse
# wide
Run(Value: int): void = external {}
using { /Verse.org/Simulation }

# dense
Run(Value:int):void = external {}
using {/Verse.org/Simulation}
```

Inline construction expressions with one named property stay compact:

```verse
Translation := vector3{Up := 1152.0}
```

Construction expressions with more than one named property are wrapped by default:

```verse
Translation := vector3 {
    Up := 1152.0,
    Down := 11.0
}
```

The same threshold-based wrapping is used for inline attribute blocks and array literals. By default, construction expressions and attribute blocks keep one named property inline, while arrays keep up to three items inline.

## Format On Save

```json
{
  "[verse]": {
    "editor.defaultFormatter": "uefnguru.verse-format",
    "editor.formatOnSave": true
  }
}
```

## Limitations

Verse Format is intentionally conservative. It formats recognized Verse patterns and avoids treating every delimiter as a generic block marker. If a construct is not recognized, the formatter should prefer preserving it over guessing.
