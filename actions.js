const { Movements, goals: { GoalNear, GoalFollow } } = require('mineflayer-pathfinder');
const toolMap = require('./toolMap');

module.exports = function(bot, mcData) {
  const sleep = ms => new Promise(res => setTimeout(res, ms));

  function getPriorityList() {
    return ['netherite', 'diamond', 'iron', 'golden', 'chainmail', 'leather'];
  }

  function getBestToolFor(toolType) {
    const toolPriority = getPriorityList();
    const tools = bot.inventory.items().filter(i => i.name.includes(toolType));
    if (!tools.length) return null;
    tools.sort((a, b) => {
      const aRank = toolPriority.findIndex(p => a.name.includes(p));
      const bRank = toolPriority.findIndex(p => b.name.includes(p));
      return aRank - bRank;
    });
    return tools[0];
  }

  async function mineBlock(type) {
    let toolType = 'pickaxe';
    for (const [key, values] of Object.entries(toolMap)) {
      if (values.some(t => type.includes(t))) {
        toolType = key;
        break;
      }
    }

    const tool = getBestToolFor(toolType);
    if (tool) await bot.equip(tool, 'hand');

    const block = bot.findBlock({ matching: b => b.name === type, maxDistance: 64 });
    if (!block) return bot.chat(`Can't find any ${type} nearby.`);
    try {
      await bot.dig(block);
      await bot.chat(`Mined ${type}!`);
    } catch (err) {
      await bot.chat(`Sorry, I couldn't mine ${type}: ${err.message}`);
    }
  }

  //Mining
  async function mineBlock(type) {
     //What tools to use for which blocks (toolmap)
    const toolMap = toolMap

    let toolType = 'pickaxe';
    if (toolMap.axe.some(t => type.includes(t))) toolType = 'axe';
    else if (toolMap.shovel.some(t => type.includes(t))) toolType = 'shovel';
    else if (toolMap.hoe.some(t => type.includes(t))) toolType = 'hoe';
    else if (toolMap.sword.some(t => type.includes(t))) toolType = 'sword';
    else if (toolMap.shears.some(t => type.includes(t))) toolType = 'shears';

    const tool = getBestToolFor(toolType);
    if (tool) await bot.equip(tool, 'hand');
    else await bot.dig(block);

    const block = bot.findBlock({ matching: b => b.name === type, maxDistance: 64 });
    if (!block) return bot.chat(`Cant find any ${type} nearby.`);
    try {
      await bot.dig(block);
      await bot.chat(`Mined ${type}!`);
    } catch (err) {
      await bot.chat(`Sorry, I couldnt mine ${type}: ${err.message}`);
    }
  }

  //Crafting
  async function craftItem(itemName, count = 1) {
    const item = mcData.itemsByName[itemName];
    if (!item) return bot.chat(`I dont know how to craft ${itemName}`);
    const recipes = bot.recipesFor(item.id);
    if (!recipes.length) return bot.chat(`No recipes for ${itemName}`);
    try {
      await bot.craft(recipes[0], count);
      await bot.chat(`Crafted ${count} ${itemName}(s)!`);
    } catch (err) {
      await bot.chat(`Sorry, I couldnt craft ${itemName}: ${err.message}`);
    }
  }


  //Smelting
  async function smelt(itemName, count = 1) {
    const furnace = bot.findBlock({ matching: block => block.name.includes('furnace'), maxDistance: 64 });
    if (!furnace) return bot.chat(`Sorry, I couldnt find a furnace nearby.`);
    try {
      const window = await bot.openFurnace(furnace);
      await bot.chat(`Started smelting ${count} ${itemName}(s)!`);
      window.close();
    } catch (err) {
      await bot.chat(`Sorry, I couldnt smelt: ${err.message}`);
    }
  }

  //Fighting
  async function fightMob(mobName) {
    const target = bot.nearestEntity(e => e.type === 'mob' && e.mobType.toLowerCase() === mobName);
    if (!target) return bot.chat(`No ${mobName} found!`);
    if (['wither', 'ender_dragon', 'warden', 'blaze', 'breeze'].includes(mobName.toLowerCase())) {
      await bot.chat(`Die!!`);
    }
      
    const weapon = getBestToolFor('sword');
    if (weapon) await bot.equip(weapon, 'hand');

    const move = new Movements(bot, mcData);
    bot.pathfinder.setMovements(move);
    bot.pathfinder.setGoal(new GoalNear(target.position.x, target.position.y, target.position.z, 1), true);

    //Fight loop
    async function combatLoop() {
      if (!target.isValid) {
        await bot.chat(`Defeated the ${mobName}!`);
        bot.pathfinder.setGoal(null);
        return;
      }

      //Bot drinks healing potion if it has one and is under 3 hearts
      if (bot.health < 6) {
        const healingPotion = bot.inventory.items().find(i => i.name.includes('potion') && i.name.includes('healing'));
        if (healingPotion) {
          try {
            await bot.equip(healingPotion, 'hand');
            await bot.activateItem();
            await bot.chat(`Drinking healing potion!`);
            await sleep(2000);
          } catch {}
        }
      }

      //Pathfinding to the target
      const dist = bot.entity.position.distanceTo(target.position);
      if (dist < 3) {
        bot.attack(target);
      } else {
        bot.pathfinder.setGoal(new GoalNear(target.position.x, target.position.y, target.position.z, 1), true);
      }

      setTimeout(combatLoop, 1000);
    }

    combatLoop();
  }

  //Following the player
  function startFollowing() {
    const target = bot.players['SheppCrafd']?.entity;
    if (!target) return bot.chat(`Can't find you!`);
    const move = new Movements(bot, mcData);
    bot.pathfinder.setMovements(move);
    bot.pathfinder.setGoal(new GoalFollow(target, 1), true);
    following = true;
    bot.chat(`Following!`).catch(console.error);
  }

  function stopFollowing() {
    bot.pathfinder.setGoal(null);
    following = false;
    bot.chat(`I stopped following.`).catch(console.error);
  }

  //Building
  async function buildStructure(args) {
    const structure = args[0];
    const size = parseInt(args[1]) || 3;
    const dirt = mcData.itemsByName['dirt'];
    const hasDirt = bot.inventory.items().find(i => i.type === dirt.id);
    if (!hasDirt) return bot.chat(`I dont have any dirt!`);
    const pos = bot.entity.position.offset(0, -1, 1);

    async function place(vec) {
      const ref = bot.blockAt(vec.offset(0, -1, 0));
      if (!ref) return;
      try {
        await bot.placeBlock(ref, vec.minus(ref.position));
      } catch (err) {
        await bot.chat(`Sorry, I couldnt: ${err.message}`);
      }
    }

    //The "platform" structure
    if (structure === 'platform') {
      for (let x = -Math.floor(size/2); x <= Math.floor(size/2); x++)
        for (let z = -Math.floor(size/2); z <= Math.floor(size/2); z++)
          await place(pos.offset(x, 0, z));
    //The "wall" structure
    } else if (structure === 'wall') {
      for (let y = 0; y < size; y++)
        for (let x = -Math.floor(size/2); x <= Math.floor(size/2); x++)
          await place(pos.offset(x, y, 1));
    
    } else if (structure === 'tower') {
      for (let y = 0; y < size; y++) await place(pos.offset(0, y, 1));
    //The "dirt house", "house", and "base" structures
    } else if (['dirt_house', 'house', 'base'].includes(structure)) {
      for (let x = 0; x < size; x++)
        for (let y = 0; y < size; y++)
          for (let z = 0; z < size; z++)
            if (x === 0 || x === size-1 || y === 0 || y === size-1 || z === 0 || z === size-1)
              await place(pos.offset(x, y, z));
    } else {
      await bot.chat('Dont know how to build ${structure}');
      return;
    }
    await bot.chat(`${structure} built`);
  }

  //Digging
  async function digHole(args) {
    const width = parseInt(args[0]) || 3;
    const depth = parseInt(args[1]) || 3;
    const length = parseInt(args[2]) || 3;
    const pos = bot.entity.position.offset(0, -1, 1);

    for (let x = 0; x < width; x++) {
      for (let z = 0; z < width; z++) {
        for (let y = 0; y < depth; y++) {
          const digPos = pos.offset(x, -y, z);
          const block = bot.blockAt(digPos);
          if (block && block.name !== 'air') {
            try {
              await bot.dig(block);
              await bot.chat(`Dug block at ${digPos}`);
            } catch (err) {
              await bot.chat(`Dig error: ${err.message}`);
            }
          }
        }
      }
    }
    await bot.chat(`Hole ${width}x${depth} dug`);
  }

  //Opening chests
  async function openChest() {
    const chest = bot.findBlock({ matching: block => block.name.includes('chest'), maxDistance: 64 });
    if (!chest) return bot.chat(`No chest nearby!`);
    try {
      const chestWindow = await bot.openChest(chest);
      await bot.chat(`Opened chest`);
      setTimeout(() => chestWindow.close(), 3000);
    } catch (err) {
      await bot.chat(`Chest error: ${err.message}`);
    }
  }

  //Picking up items
  async function pickupItems() {
    const items = Object.values(bot.entities).filter(e => e.objectType === 'Item');
    if (!items.length) return bot.chat(`You didnt drop any items that i see`);
    const move = new Movements(bot, mcData);
    bot.pathfinder.setMovements(move);
    bot.pathfinder.setGoal(new GoalNear(items[0].position.x, items[0].position.y, items[0].position.z, 1));
    await bot.chat(`On my way to pick up your items!`);
  }

  //Getting an item from an item frame
  async function getItemFrame() {
    const frames = Object.values(bot.entities).filter(e => e.entityType === 71); // Item frame ID
    if (!frames.length) return bot.chat(`No item frames nearby!`);
    try {
      await bot.activateEntity(frames[0]);
      await bot.chat(`Got item from frame`);
    } catch (err) {
      await bot.chat(`Sorry, i couldnt: ${err.message}`);
    }
  }

  //Eqipping armor
  async function equipArmor() {
    const armorSlots = ['head', 'torso', 'legs', 'feet'];
    const armorPriority = getPriorityList();
    const armorTypes = ['helmet', 'chestplate', 'leggings', 'boots'];
    let equippedAny = false;
    for (let i = 0; i < armorTypes.length; i++) {
      const matchingItems = bot.inventory.items()
        .filter(it => it.name.includes(armorTypes[i]))
        // Sort highest priority first:
        .sort((a, b) => armorPriority.findIndex(p => b.name.includes(p)) - armorPriority.findIndex(p => a.name.includes(p)));
      if (matchingItems.length) {
        try {
          await bot.equip(matchingItems[0], armorSlots[i]);
          await bot.chat(`Equipped ${matchingItems[0].name}`);
          equippedAny = true;
        } catch (err) {
          await bot.chat(`Sorry, i couldnt equip ${matchingItems[0].name}: ${err.message}`);
        }
      }
    }
    if (!equippedAny) await bot.chat(`I don't have any armor to equip`);
  }

  //Sleeping
  async function sleepInBed() {
    const bed = bot.findBlock({ matching: block => block.name.includes('bed'), maxDistance: 64 });
    if (!bed) return bot.chat(`No bed nearby!`);
    try {
      await bot.sleep(bed);
      await bot.chat(`I'm sleeping now. zzz`);
    } catch (err) {
      await bot.chat(`Sorry, i couldnt: ${err.message}`);
    }
  }

  //Telling the player its inventory
  async function showInventory() {
    const items = bot.inventory.items();
    if (!items.length) return bot.chat(`I'm empty`);
    await bot.chat(`Here's what I'm carrying:`);
    for (const item of items) {
      await bot.chat(`${item.count}x ${item.name}`);
    }
  }

  //Sorting its inventory
  async function listInventorySorted() {
    const items = bot.inventory.items();
    if (!items.length) return bot.chat(`I'm empty`);
    const sorted = items.slice().sort((a, b) => a.name.localeCompare(b.name));
    await bot.chat(`Inventory sorted:`);
    for (const item of sorted) {
      await bot.chat(`${item.count}x ${item.name}`);
    }
  }

  // Export functions for use elsewhere if needed
  return {
    mineBlock,
    craftItem,
    smelt,
    fightMob,
    getBestToolFor,
    startFollowing,
    stopFollowing,
    buildStructure,
    digHole,
    openChest,
    pickupItems,
    getItemFrame,
    equipArmor,
    showInventory,
    listInventorySorted
  };
};