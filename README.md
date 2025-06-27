# AI_Paul – Your Smartest Minecraft BFF (Built with Mineflayer + LLaMA AI)
AI_Paul is a customizable Minecraft bot for Windows inspired by Kolanii and Emergent Garden. Powered by mineflayer and two local LLaMA AIs, he chats like a real friend, remembers conversations, talks out loud, and even re-writes his code when you ask him do do something he doesn't know. AI_Paul is constantly being worked on, so if the files don't work, that is because it is a new and untested or erroring version.

# Features:

Real-time AI chat powered by LLaMA (via Ollama),
in-game memory and conversation history,
dynamic function generation (createfunc, runfunc),
text-to-speech responses with say(),
fully modular architecture (clean, separated files),
built by a 12-year-old roboticist (me)

# Stack (aka the stuff you have to download):
Node.js,
Mineflayer,
Ollama, LLaMA3, and CodeLLaMA,
PowerShell,
Minecraft 1.20.6 (Java).


# Commands:

# Mining & Digging

"mine (block)"	Finds and mines the nearest block of that type using the best tool.
"dig (width) (depth) (length)"	Digs a hole with the given dimensions under the bot.

# Crafting & Smelting

"craft (itemName) [count]"	Crafts the specified item. Defaults to one if count not provided.
"smelt (itemName) [count]"	Smelts the specified item using the nearest furnace.

# Combat

"fight (mobName)"	Attacks the nearest mob with that name. Prioritizes healing if health is low. Special responses for boss mobs.

# Following

"follow"	Follows the player automatically.
"stop"	Stops following the player.

# Building

"build platform (size)"	Builds a square dirt platform.
"build wall (size)"	Builds a vertical dirt wall.
"build tower (size)"	Builds a tall dirt tower.
"build house (size)"	Builds a hollow cube structure. Also triggered by "base" or "dirt_house".

# Inventory

"inventory"	Lists all items in the bot’s inventory.
"inventory sorted"	Lists items, sorted alphabetically.
"equip armor"	Equips the best armor available.
"get itemframe"	Interacts with the nearest item frame to grab the item.
pickup	Picks up nearby dropped items.

# Sleeping

"sleep"	Sleeps in the nearest bed, if available.

# Notes
Automatically uses the best tools and armor based on material (netherite -> diamond -> iron -> gold -> chainmail -> leather).

Uses Mineflayer-Pathfinder for navigation.

Provides friendly in-game chat responses for everything that isn't a command.

Use "write a new function that..." to make a new function with CodeLLaMA
