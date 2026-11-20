(() => {
  "use strict";

  const key = "jade-circuit.equipment.v2";
  let memory;
  let memoryOnly = false;

  function read() {
    if (memoryOnly) return structuredClone(memory);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return JadeGear.starter(localStorage.getItem("jade-circuit.equipment.v1"));
      const saved = JSON.parse(raw);
      const bag = {};
      for (const [item, count] of Object.entries(saved.bag)) {
        if (JadeGear.piece(item) && Number.isSafeInteger(count) && count > 0) bag[item] = count;
      }
      const worn = JadeGear.decode(JadeGear.encode(saved.worn));
      return { bag, worn };
    } catch {
      return structuredClone(memory || JadeGear.starter());
    }
  }

  async function update(action, item, onChange) {
    const apply = () => {
      const state = read();
      const before = JadeGear.power(state.worn);
      if (!JadeGear.change(state, action, item)) return false;
      memory = state;
      try { localStorage.setItem(key, JSON.stringify(state)); }
      catch { memoryOnly = true; }
      onChange?.(before, JadeGear.power(state.worn));
      return true;
    };
    return navigator.locks ? navigator.locks.request(key, apply) : apply();
  }

  window.JadeLoadout = Object.freeze({ key, read, update });
})();
