export function formatPositionName(position: string | undefined): string {
  if (!position) return "";
  
  const lower = position.toLowerCase();
  
  if (lower === "president") return "Presidential";
  if (lower === "vice president" || lower === "vice-president") return "Vice Presidential";
  if (lower === "governor") return "Governorship";
  if (lower === "deputy governor" || lower === "deputy-governor") return "Deputy Governorship";
  if (lower === "senator") return "Senatorial";
  if (lower === "house of representatives" || lower === "house-of-reps") return "Federal House of Reps";
  if (lower === "state house of assembly" || lower === "state-house-of-assembly") return "State House of Assembly";
  if (lower === "lga chairman" || lower === "local government chairman" || lower === "lga-chairman") return "Local Government Chairmanship";
  if (lower === "councillor") return "Councillorship";
  
  // Return original if no formatting rule matches
  return position;
}
