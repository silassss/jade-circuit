(() => {
  "use strict";

  const byId = id => document.getElementById(id);
  const { slots, items, piece, qualities, description } = JadeGear;
  const dialog = byId("gear-dialog");
  const content = byId("detail-content");
  const confirm = byId("detail-action");
  const message = byId("gear-message");
  let selection = null;
  let opener = null;

  function art(item) {
    const image = document.createElement("img");
    image.className = "gear-icon";
    image.src = "assets/equipment/" + item.icon + ".png";
    image.alt = "";
    image.draggable = false;
    return image;
  }
  function node(tag, text, cls) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  }
  function tile(item, caption, empty = false) {
    const button = node("button", undefined, "gear-tile tier-" + (empty ? 0 : item.rank));
    button.type = "button";
    button.append(art(item),node("small",caption));
    return button;
  }
  function bagKeys(state) {
    return Object.keys(state.bag).filter(key => state.bag[key] > 0).sort((a,b) => {
      const first = piece(a), second = piece(b);
      return slots.indexOf(first.slot) - slots.indexOf(second.slot) || first.name.localeCompare(second.name) || second.rank-first.rank;
    });
  }
  function mergeable(state) {
    return bagKeys(state).filter(key => state.bag[key] >= 2 && piece(key).rank < qualities.length);
  }
  function openPanel(mode, key, trigger) {
    selection = {mode,key};
    opener = trigger;
    renderPanel();
    dialog.showModal();
    dialog.querySelector(".gear-close").focus();
  }
  function choose(keys, selected) {
    const select = node("select");
    select.setAttribute("aria-label","Choose equipment");
    for (const key of keys) {
      const item = piece(key);
      const opt = node("option",item.quality + " " + item.name);
      opt.value = key;
      select.append(opt);
    }
    select.value = selected;
    select.onchange = () => { selection.key = select.value; renderPanel(); content.querySelector("select")?.focus(); };
    return select;
  }
  const popup = byId("power-popup");
  let powerFrame;
  let hideTimer;
  function hidePower() {
    cancelAnimationFrame(powerFrame);
    clearTimeout(hideTimer);
    popup.hidePopover();
  }
  function showPower(before, after) {
    hidePower();
    const delta = after - before;
    const total = byId("power-total");
    total.textContent = before;
    popup.dataset.direction = delta < 0 ? "down" : "up";
    byId("power-delta").textContent = delta > 0 ? "↑ +" + delta : delta < 0 ? "↓ −" + Math.abs(delta) : "±0";
    popup.showPopover();
    const start = performance.now();
    function count(now) {
      const t = Math.min(1, (now - start) / 720);
      total.textContent = Math.round(before + delta * t);
      if (t < 1) powerFrame = requestAnimationFrame(count);
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) total.textContent = after;
    else powerFrame = requestAnimationFrame(count);
    hideTimer = setTimeout(hidePower, 1550);
  }
  window.addEventListener("hashchange", hidePower);

  function renderPanel() {
    const state = JadeLoadout.read();
    const {mode} = selection;
    const merging = mode === "merge";
    const options = merging ? mergeable(state) : mode === "slot"
      ? bagKeys(state).filter(key=>piece(key).slot === selection.slot) : [];
    if ((merging || mode === "slot") && !options.includes(selection.key)) selection.key = options[0];
    const item = piece(selection.key);
    content.replaceChildren();
    byId("detail-title").textContent = merging ? "Merge gear" : item?.name || selection.slot || "Equipment";
    dialog.classList.toggle("item-panel", !!item && !merging);
    confirm.hidden = !item;
    if (!item) {
      content.append(node("p",merging ? "Collect two spare copies of the same item and quality to merge." : "No spare gear for this slot."));
      return;
    }
    if ((merging || mode === "slot") && options.length > 1) content.append(choose(options,item.key));
    if (merging) {
      const next = piece(item.id+"."+(item.rank+1));
      const preview = node("div",undefined,"merge-preview");
      for (const [gear,count] of [[item,2],[next,1]]) {
        if (count===1) preview.append(node("b","→"));
        const block=node("div",undefined,"merge-chip tier-"+gear.rank);
        block.append(art(gear),node("strong",gear.quality+" ×"+count));
        preview.append(block);
      }
      content.append(preview,node("p", "Uses 2 spare " + item.name + " copies. " + state.bag[item.key] + " available."),
        node("p",next.quality+" effect · "+description(next),"effect-line"));
      confirm.textContent = "Merge 2 into 1";
    } else {
      const detail=node("div",undefined,"item-summary tier-"+item.rank);
      const identity = node("div",undefined,"item-identity");
      identity.append(node("small",item.quality+" · "+item.slot),node("strong",description(item)));
      detail.append(art(item),identity);
      const effects = node("ul",undefined,"quality-effects");
      for (const [index, quality] of qualities.entries()) {
        const tier = piece(item.id+"."+(index+1));
        const row = node("li");
        row.classList.toggle("current",tier.rank === item.rank);
        row.append(node("b",quality),node("span",description(tier)));
        effects.append(row);
      }
      content.append(detail,node("h3","Quality effects"),effects);
      const worn = piece(state.worn[item.slot]);
      const equipped = worn?.key === item.key;
      if (mode !== "worn" && worn) content.append(node("p","Equipped · "+worn.quality+" "+worn.name));
      confirm.hidden = mode !== "worn" && (equipped || !state.bag[item.key]);
      confirm.textContent = mode === "worn" ? "Unequip" : "Equip";
    }
  }
  function refresh() {
    const state = JadeLoadout.read();
    byId("gear-left").replaceChildren();
    byId("gear-right").replaceChildren();
    // Match the two equipment columns in the Rally Loadout reference.
    const arranged = ["Weapon", "Armor", "Scarf", "Ring", "Boots", "Amulet"];
    arranged.forEach((slot,i) => {
      const item = piece(state.worn[slot]);
      const display = item || items.find(entry=>entry.slot===slot);
      const button = tile(display,slot,!item);
      button.dataset.slot=slot;
      button.setAttribute("aria-label",slot+" · "+(item ? item.quality+" "+item.name : "Empty"));
      button.title = button.getAttribute("aria-label");
      button.onclick = () => {
        if (item) openPanel("worn",item.key,button);
        else {
          selection = {mode:"slot",slot,key:null}; opener = button;
          renderPanel(); dialog.showModal(); dialog.querySelector(".gear-close").focus();
        }
      };
      byId(i<3 ? "gear-left" : "gear-right").append(button);
    });
    const bonus = JadeGear.bonuses(state.worn);
    let levels = JadeTalents.starter().levels;
    try { levels = JadeTalents.load(localStorage).levels; } catch { /* Use starter stats if storage is unavailable. */ }
    const base = JadeTalents.stats(levels, JadeCombat.tuning);
    const stats = byId("gear-stats");
    stats.replaceChildren();
    for (const [label,value] of [["HP",base.hp+bonus.health],["ATK",base.attack+bonus.attack],["Shield",base.shield+bonus.shield]]) {
      const stat = node("span");
      stat.dataset.statIcon = label;
      stat.append(node("small",label),node("strong",value));
      stats.append(stat);
    }
    const bag = byId("gear-list"); bag.replaceChildren();
    const keys = bagKeys(state);
    byId("bag-count").textContent = keys.reduce((sum,key)=>sum+state.bag[key],0);
    for (const key of keys) {
      const item = piece(key);
      for (let n=0;n<state.bag[key];n++) {
        const button = tile(item,item.quality);
        button.dataset.piece=key;
        button.title = item.quality+" "+item.name;
        button.setAttribute("aria-label",button.title);
        button.onclick = () => openPanel("bag",key,button);
        bag.append(button);
      }
    }
    if (!keys.length) bag.append(node("p","All gear is equipped."));
    if (dialog.open) renderPanel();
  }
  byId("show-merge").onclick = event => openPanel("merge",null,event.currentTarget);
  dialog.querySelector(".gear-close").onclick = () => dialog.close();
  dialog.addEventListener("close", () => {
    if (dialog.open) return;
    const target = opener?.dataset.slot ? document.querySelector('[data-slot="'+opener.dataset.slot+'"]')
      : opener?.dataset.piece ? document.querySelector('[data-piece="'+opener.dataset.piece+'"]') : opener;
    (target || byId("show-merge")).focus({preventScroll:true});
    selection=null;
  });
  confirm.onclick = async () => {
    if (!selection || confirm.disabled) return;
    confirm.disabled = true;
    try {
      const item = piece(selection.key);
      const action = selection.mode === "merge" ? "merge" : selection.mode === "worn" ? "remove" : "equip";
      let powerChange;
      if (!item || !await JadeLoadout.update(action,item.key,(before,after) => {
        powerChange = {before, after};
      })) { refresh(); return; }
      JadeAudio.sound(action === "merge" ? "confirm" : "click");
      message.textContent = action === "merge" ? "Merged · " + qualities[item.rank]+" "+item.name+" added to inventory."
        : (action === "remove" ? "Unequipped · " : "Equipped · ") + item.name;
      dialog.close();
      refresh();
      if (action !== "merge") {
        showPower(powerChange.before, powerChange.after);
        message.textContent += " · Power " + powerChange.after;
      }
      window.dispatchEvent(new Event("gear-changed"));
    } finally { confirm.disabled = false; }
  };
  window.addEventListener("talents-changed",refresh);
  window.addEventListener("pageshow",refresh);
  window.addEventListener("storage",e=>{if (!e.key || e.key === JadeLoadout.key || e.key === JadeTalents.key) refresh();});
  refresh();
})();
