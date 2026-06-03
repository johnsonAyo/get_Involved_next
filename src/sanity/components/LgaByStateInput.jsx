import { Select, Stack, Text } from "@sanity/ui";
import { set, unset, useFormValue } from "sanity";
import { nigeriaGeo } from "../../data/nigeria.js";

export function LgaByStateInput(props) {
  const stateId = useFormValue(["stateId"]);
  const selectedStateId =
    typeof stateId === "string" ? stateId.toLowerCase() : "";

  const state = selectedStateId
    ? nigeriaGeo.find((item) => item.id.toLowerCase() === selectedStateId)
    : null;
  const lgas = state ? state.lgas : [];

  const value = typeof props.value === "string" ? props.value : "";
  const disabled = props.readOnly || !selectedStateId;

  return (
    <Stack space={2}>
      <Select
        id={props.id}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const nextValue = event.currentTarget.value;
          props.onChange(nextValue ? set(nextValue) : unset());
        }}
      >
        <option value="">
          {selectedStateId ? "Select an LGA" : "Select a state first"}
        </option>
        {lgas.map((lga) => (
          <option key={lga} value={lga}>
            {lga}
          </option>
        ))}
      </Select>

      {!selectedStateId ? (
        <Text size={1} muted>
          Pick a state before selecting an LGA.
        </Text>
      ) : null}
    </Stack>
  );
}
