import { detectOrionComponents } from "../../src/core/orionComponentDetector";

const makeLargeTemplate = (count: number): string => {
  const items = Array.from({ length: count }, (_, i) => `    <OrionButton /> <!-- ${i} -->`).join("\n");
  return `<template>\n  <div>\n${items}\n  </div>\n</template>`;
};

const sfc = `${makeLargeTemplate(2000)}\n<script setup>\nconst x = 1;\n</script>`;
const canonical = new Set(["orion-button"]);

const start = Date.now();
const result = detectOrionComponents(sfc, canonical);
const end = Date.now();

console.log("Detected components:", result.components);
console.log("Duration (ms):", end - start);
