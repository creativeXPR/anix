// Emoji set for the emoji panel (EmojiPanel.jsx), grouped like WhatsApp's.
// One entry per line: the emoji, then search keywords. Kept to Emoji ≤13
// so older Android phones render every glyph. Loaded lazily with the panel.
const RAW = {
  smileys: `
😀 grin happy smile
😃 smile happy joy
😄 smile laugh happy
😁 grin beam teeth
😆 laugh lol squint
😅 sweat smile nervous
🤣 rofl rolling laugh lol
😂 joy tears laugh lol crying
🙂 slight smile
🙃 upside down silly
😉 wink
😊 blush smile happy
😇 angel halo innocent
🥰 love hearts adore
😍 heart eyes love crush
🤩 star struck wow
😘 kiss blow love
😗 kiss
☺️ smile relaxed
😚 kiss closed eyes
😙 kiss smile
🥲 smile tear proud
😋 yum delicious tongue
😛 tongue
😜 wink tongue crazy
🤪 zany crazy goofy
😝 tongue squint
🤑 money rich
🤗 hug hugs
🤭 giggle oops hand mouth
🤫 shush quiet secret
🤔 thinking hmm
🤐 zipper mouth secret
🤨 raised eyebrow sus suspicious
😐 neutral meh
😑 expressionless blank
😶 no mouth speechless
😏 smirk smug
😒 unamused annoyed
🙄 eye roll
😬 grimace awkward
🤥 lying pinocchio
😌 relieved calm
😔 pensive sad
😪 sleepy
🤤 drool
😴 sleeping zzz tired
😷 mask sick
🤒 thermometer sick ill
🤕 bandage hurt
🤢 nauseated sick
🤮 vomit sick gross
🤧 sneeze sick
🥵 hot sweating
🥶 cold freezing
🥴 woozy drunk dizzy
😵 dizzy dead
🤯 mind blown shocked
🤠 cowboy
🥳 party celebrate birthday
🥸 disguise
😎 cool sunglasses
🤓 nerd geek
🧐 monocle curious
😕 confused
😟 worried
🙁 frown sad
☹️ frown sad
😮 open mouth wow surprised
😯 hushed surprised
😲 astonished shocked
😳 flushed embarrassed shy
🥺 pleading puppy eyes please
😦 frowning
😧 anguished
😨 fearful scared
😰 anxious sweat
😥 sad relieved
😢 cry sad tear
😭 sob crying loudly
😱 scream fear shocked
😖 confounded
😣 persevere
😞 disappointed sad
😓 sweat downcast
😩 weary tired
😫 tired exhausted
🥱 yawn bored
😤 triumph huff angry
😡 pout angry mad
😠 angry mad
🤬 cursing swearing angry
😈 devil smiling evil
👿 imp devil angry
💀 skull dead lol dying
☠️ skull crossbones
💩 poop
🤡 clown
👹 ogre
👺 goblin
👻 ghost boo anix
👽 alien
👾 alien monster game
🤖 robot
😺 cat smile
😸 cat grin
😹 cat joy tears
😻 cat heart eyes
😼 cat smirk
😽 cat kiss
🙀 cat weary shocked
😿 cat crying
😾 cat pouting
🙈 see no evil monkey shy
🙉 hear no evil monkey
🙊 speak no evil monkey oops`,
  people: `
👋 wave hello hi bye
🤚 raised back hand
🖐️ hand fingers splayed
✋ raised hand stop high five
🖖 vulcan
👌 ok perfect
🤌 pinched fingers italian
🤏 pinch small little
✌️ peace victory
🤞 fingers crossed luck hope
🤟 love you gesture
🤘 rock on horns
🤙 call me shaka
👈 point left
👉 point right
👆 point up
🖕 middle finger
👇 point down
☝️ index up
👍 thumbs up like yes good
👎 thumbs down dislike no bad
✊ fist raised
👊 fist bump punch
🤛 left fist bump
🤜 right fist bump
👏 clap applause
🙌 raising hands praise yay
👐 open hands
🤲 palms up
🤝 handshake deal
🙏 pray please thanks
✍️ writing
💅 nail polish slay
🤳 selfie
💪 muscle strong flex
🦾 mechanical arm
🦵 leg
🦶 foot
👂 ear listen
👃 nose
🧠 brain smart
🫀 heart anatomical
🦷 tooth
🦴 bone
👀 eyes look see tea
👁️ eye
👅 tongue
👄 mouth lips
💋 kiss lips
👶 baby
🧒 child
👦 boy
👧 girl
🧑 person
👱 blond
👨 man
🧔 beard
👩 woman
🧓 older person
👴 old man
👵 old woman
🙍 frowning person
🙎 pouting person
🙅 no gesture
🙆 ok gesture
💁 tipping hand sassy
🙋 raising hand
🧏 deaf person
🙇 bowing sorry
🤦 facepalm
🤷 shrug idk whatever
👮 police
🕵️ detective spy
💂 guard
🥷 ninja
👷 construction worker
🤴 prince
👸 princess queen
👳 turban
👲 cap
🧕 headscarf hijab
🤵 tuxedo groom
👰 bride veil
🤰 pregnant
🤱 breastfeeding
👼 baby angel
🎅 santa christmas
🤶 mrs claus
🦸 superhero
🦹 villain
🧙 mage wizard
🧚 fairy
🧛 vampire
🧜 merperson mermaid
🧝 elf
🧞 genie
🧟 zombie
💆 massage
💇 haircut
🚶 walking
🧍 standing
🧎 kneeling
🏃 running
💃 dancing woman dance
🕺 dancing man dance
👯 bunny dancers besties
🧖 sauna
🧗 climbing
🤺 fencing
🏇 horse racing
⛷️ skier
🏂 snowboard
🏌️ golf
🏄 surfing
🚣 rowing
🏊 swimming
⛹️ basketball person
🏋️ weightlifting gym
🚴 biking
🤸 cartwheel
🤼 wrestling
🤽 water polo
🤾 handball
🤹 juggling
🧘 yoga meditate
🛀 bath
🛌 sleeping bed
👭 women holding hands friends
👫 couple holding hands
👬 men holding hands
💏 kiss couple
💑 couple heart
👪 family
🗣️ speaking
👤 silhouette
👥 silhouettes people
👣 footprints`,
  animals: `
🐶 dog puppy
🐱 cat kitty
🐭 mouse
🐹 hamster
🐰 rabbit bunny
🦊 fox
🐻 bear
🐼 panda
🐨 koala
🐯 tiger
🦁 lion
🐮 cow
🐷 pig
🐽 pig nose
🐸 frog tea
🐵 monkey
🐔 chicken
🐧 penguin
🐦 bird
🐤 chick
🦆 duck
🦅 eagle
🦉 owl night
🦇 bat
🐺 wolf
🐗 boar
🐴 horse
🦄 unicorn
🐝 bee
🪱 worm
🐛 bug caterpillar
🦋 butterfly
🐌 snail
🐞 ladybug
🐜 ant
🪰 fly
🦗 cricket crickets
🕷️ spider
🦂 scorpion
🐢 turtle slow
🐍 snake
🦎 lizard
🦖 t rex dinosaur
🦕 dinosaur
🐙 octopus
🦑 squid
🦐 shrimp
🦞 lobster
🦀 crab
🐡 blowfish
🐠 tropical fish
🐟 fish
🐬 dolphin
🐳 whale
🐋 whale
🦈 shark
🐊 crocodile
🐅 tiger
🐆 leopard
🦓 zebra
🦍 gorilla
🐘 elephant
🦛 hippo
🦏 rhino
🐪 camel
🦒 giraffe
🦘 kangaroo
🐃 water buffalo
🐄 cow
🐎 horse
🐖 pig
🐏 ram
🐑 sheep
🦙 llama
🐐 goat
🦌 deer
🐕 dog
🐩 poodle
🐈 cat
🐓 rooster
🦃 turkey
🦚 peacock
🦜 parrot
🦢 swan
🦩 flamingo
🕊️ dove peace
🐇 rabbit
🦝 raccoon
🦨 skunk
🦡 badger
🦦 otter
🦥 sloth lazy
🐁 mouse
🐀 rat
🐿️ chipmunk
🦔 hedgehog
🐾 paw prints
🐉 dragon
🌵 cactus
🎄 christmas tree
🌲 evergreen tree
🌳 tree
🌴 palm tree
🌱 seedling
🌿 herb
☘️ shamrock
🍀 four leaf clover luck
🍃 leaves
🍂 fallen leaf autumn
🍁 maple leaf
🍄 mushroom
🐚 shell
🌾 rice
💐 bouquet flowers
🌷 tulip
🌹 rose
🥀 wilted flower
🌺 hibiscus
🌸 cherry blossom
🌼 blossom
🌻 sunflower
🌞 sun face
🌝 full moon face
🌛 moon face
🌚 new moon face
🌕 full moon
🌙 crescent moon night
🌎 earth globe world
🪐 saturn planet
💫 dizzy star
⭐ star
🌟 glowing star
✨ sparkles
⚡ lightning zap
☄️ comet
💥 boom collision
🔥 fire lit hot
🌪️ tornado
🌈 rainbow pride
☀️ sun sunny
⛅ cloud sun
☁️ cloud
🌧️ rain
⛈️ storm thunder
❄️ snowflake cold
☃️ snowman
🌬️ wind
💨 dash
💧 droplet
💦 sweat drops
🌊 wave ocean`,
  food: `
🍏 green apple
🍎 apple red
🍐 pear
🍊 orange tangerine
🍋 lemon
🍌 banana
🍉 watermelon
🍇 grapes
🍓 strawberry
🫐 blueberries
🍈 melon
🍒 cherries
🍑 peach
🥭 mango
🍍 pineapple
🥥 coconut
🥝 kiwi
🍅 tomato
🍆 eggplant
🥑 avocado
🥦 broccoli
🥬 leafy green
🥒 cucumber
🌶️ hot pepper spicy
🫑 bell pepper
🌽 corn
🥕 carrot
🧄 garlic
🧅 onion
🥔 potato
🍠 sweet potato
🥐 croissant
🥯 bagel
🍞 bread
🥖 baguette
🥨 pretzel
🧀 cheese
🥚 egg
🍳 cooking fried egg
🧈 butter
🥞 pancakes
🧇 waffle
🥓 bacon
🥩 steak meat
🍗 chicken leg
🍖 meat bone
🌭 hot dog
🍔 burger hamburger
🍟 fries chips
🍕 pizza
🥪 sandwich
🌮 taco
🌯 burrito
🥗 salad
🍝 spaghetti pasta
🍜 noodles ramen indomie
🍲 stew pot soup
🍛 curry rice
🍣 sushi
🍱 bento
🥟 dumpling
🍤 fried shrimp
🍙 rice ball
🍚 rice
🍘 rice cracker
🍥 fish cake
🥠 fortune cookie
🍢 oden
🍡 dango
🍧 shaved ice
🍨 ice cream
🍦 soft ice cream
🥧 pie
🧁 cupcake
🍰 cake slice
🎂 birthday cake
🍮 custard flan
🍭 lollipop
🍬 candy
🍫 chocolate
🍿 popcorn tea drama
🍩 doughnut donut
🍪 cookie
🌰 chestnut
🥜 peanuts
🍯 honey
🥛 milk
☕ coffee tea hot
🍵 tea
🧃 juice box
🥤 cup straw soda
🧋 bubble tea boba
🍶 sake
🍺 beer
🍻 cheers beers
🥂 champagne cheers toast
🍷 wine
🥃 whiskey
🍸 cocktail
🍹 tropical drink
🍾 champagne bottle celebrate
🧊 ice
🥄 spoon
🍴 fork knife
🍽️ plate`,
  activities: `
⚽ soccer football
🏀 basketball
🏈 american football
⚾ baseball
🥎 softball
🎾 tennis
🏐 volleyball
🏉 rugby
🥏 frisbee
🎱 8 ball pool
🏓 ping pong
🏸 badminton
🏒 hockey
🥅 goal net
⛳ golf flag
🏹 bow arrow
🎣 fishing
🤿 diving
🥊 boxing glove
🥋 martial arts
🎽 running shirt
🛹 skateboard
🛼 roller skate
⛸️ ice skate
🥌 curling
🎿 ski
🏆 trophy win
🥇 gold medal first
🥈 silver medal second
🥉 bronze medal third
🏅 medal
🎖️ military medal
🎗️ ribbon
🎫 ticket
🎟️ admission tickets
🎪 circus
🎭 theater drama
🎨 art palette
🎬 clapper movie film
🎤 microphone sing karaoke
🎧 headphones music
🎼 music score
🎹 piano keyboard
🥁 drum
🎷 saxophone
🎺 trumpet
🎸 guitar
🎻 violin
🎲 dice game random
♟️ chess pawn
🎯 bullseye target dart
🎳 bowling
🎮 video game controller
🕹️ joystick
🧩 puzzle
🎉 party popper tada celebrate
🎊 confetti ball
🎈 balloon
🎁 gift present
🎀 ribbon bow
🎃 pumpkin halloween
🎆 fireworks
🎇 sparkler
🧨 firecracker`,
  travel: `
🚗 car
🚕 taxi
🚙 suv
🚌 bus
🏎️ race car
🚓 police car
🚑 ambulance
🚒 fire engine
🚚 truck
🚜 tractor
🛵 scooter
🏍️ motorcycle
🚲 bicycle bike
🛴 kick scooter
🚨 siren alert
🚔 police
🚖 taxi
🚡 tram
🚂 train
🚆 train
🚇 metro
✈️ airplane plane travel
🛫 departure
🛬 arrival
🚀 rocket launch
🛸 ufo flying saucer
🚁 helicopter
⛵ sailboat
🚤 speedboat
🛳️ ship
⚓ anchor
⛽ fuel
🚧 construction
🚦 traffic light
🗺️ map
🗽 statue of liberty
🗼 tower
🏰 castle
🎡 ferris wheel
🎢 roller coaster
🎠 carousel
⛲ fountain
🏖️ beach
🏝️ island
🏜️ desert
🌋 volcano
⛰️ mountain
🏔️ snow mountain
🏕️ camping
⛺ tent
🏠 house home
🏡 house garden
🏢 office building
🏥 hospital
🏦 bank
🏨 hotel
🏫 school
⛪ church
🕌 mosque
🌁 foggy
🌃 night stars city
🏙️ cityscape
🌄 sunrise mountains
🌅 sunrise
🌆 dusk city
🌇 sunset
🌉 bridge night
🎑 moon viewing
🗾 japan
🌌 milky way galaxy`,
  objects: `
⌚ watch
📱 phone mobile
💻 laptop computer
⌨️ keyboard
🖥️ desktop computer
🖨️ printer
🖱️ mouse
💽 disk
💾 floppy save
💿 cd
📷 camera photo
📸 camera flash
📹 video camera
🎥 movie camera
📞 telephone call
☎️ phone
📺 tv television
📻 radio
⏰ alarm clock
⌛ hourglass
⏳ hourglass waiting
📡 satellite
🔋 battery
🔌 plug
💡 bulb idea
🔦 flashlight
🕯️ candle
💸 money flying
💵 dollar cash
💰 money bag
💳 credit card
💎 gem diamond
⚖️ scales
🔧 wrench
🔨 hammer
⚙️ gear settings
🔫 water pistol
💣 bomb
🔪 knife
🛡️ shield
🔮 crystal ball
🧿 nazar evil eye
💈 barber
🔭 telescope
🔬 microscope
💊 pill
💉 syringe
🩸 blood
🧬 dna
🌡️ thermometer
🧹 broom
🧺 basket
🧻 toilet paper
🚽 toilet
🚿 shower
🛁 bathtub
🧼 soap
🪒 razor
🛎️ bell
🔑 key
🗝️ old key
🚪 door
🛋️ couch
🛏️ bed
🧸 teddy bear
🖼️ picture frame
🛍️ shopping bags
🛒 cart
🎁 gift
🎈 balloon
✉️ envelope letter
📩 envelope arrow
📨 incoming envelope
📧 email
💌 love letter
📦 package box
🏷️ label tag
📜 scroll
📄 page document
📅 calendar
📆 calendar
📇 card index
📈 chart up
📉 chart down
📊 bar chart
📋 clipboard
📌 pushpin pin
📍 pin location
📎 paperclip
✂️ scissors
🖊️ pen
✏️ pencil
📝 memo note
📁 folder
📚 books study
📖 book read
🔖 bookmark
🔗 link
📣 megaphone
📢 loudspeaker
🔔 bell notification
🔕 no bell mute
🎵 music note
🎶 notes music
🔒 locked lock
🔓 unlocked
🔐 lock key
🔍 search magnifying glass
💬 speech bubble chat
💭 thought bubble
🗯️ anger bubble`,
  symbols: `
❤️ red heart love
🧡 orange heart
💛 yellow heart
💚 green heart
💙 blue heart
💜 purple heart anix love
🖤 black heart
🤍 white heart
🤎 brown heart
💔 broken heart
❣️ heart exclamation
💕 two hearts love
💞 revolving hearts
💓 beating heart
💗 growing heart
💖 sparkling heart
💘 heart arrow cupid
💝 heart ribbon gift
💟 heart decoration
☮️ peace
✝️ cross
☪️ star crescent
🕉️ om
☯️ yin yang
♈ aries
♉ taurus
♊ gemini
♋ cancer
♌ leo
♍ virgo
♎ libra
♏ scorpio
♐ sagittarius
♑ capricorn
♒ aquarius
♓ pisces
🆔 id
⚛️ atom
☢️ radioactive
☣️ biohazard
📴 phone off
📳 vibration
🈶 not free
🆚 vs versus
💮 white flower
🉐 bargain
㊙️ secret
㊗️ congratulations
🅰️ a blood type
🅱️ b blood type
🆎 ab
🆑 cl
🅾️ o
🆘 sos help
❌ cross x no wrong
⭕ circle
🛑 stop sign
⛔ no entry
📛 name badge
🚫 prohibited
💯 hundred 100 perfect
💢 anger
♨️ hot springs
🚷 no pedestrians
🔞 18 adult
📵 no phones
❗ exclamation
❕ white exclamation
❓ question
❔ white question
‼️ double exclamation
⁉️ exclamation question
🔅 dim
🔆 bright
⚠️ warning
🚸 children crossing
🔱 trident
⚜️ fleur de lis
🔰 beginner
♻️ recycle
✅ check yes done
💹 chart
❇️ sparkle
✳️ asterisk
❎ cross mark button
🌐 globe web
💠 diamond dot
Ⓜ️ m circled
🌀 cyclone
💤 zzz sleep
🏧 atm
🚾 wc
♿ wheelchair
🅿️ parking
🚹 mens
🚺 womens
🚼 baby symbol
🚻 restroom
🎦 cinema
📶 signal bars
🆗 ok button
🆙 up
🆒 cool
🆕 new
🆓 free
0️⃣ zero
1️⃣ one
2️⃣ two
3️⃣ three
4️⃣ four
5️⃣ five
6️⃣ six
7️⃣ seven
8️⃣ eight
9️⃣ nine
🔟 ten
🔢 numbers
#️⃣ hash
▶️ play
⏸️ pause
⏹️ stop
⏺️ record
⏭️ next
⏮️ previous
⏩ fast forward
⏪ rewind
🔀 shuffle
🔁 repeat
🔂 repeat one
◀️ reverse
🔼 up
🔽 down
➡️ right arrow
⬅️ left arrow
⬆️ up arrow
⬇️ down arrow
↗️ up right
↘️ down right
↙️ down left
↖️ up left
↕️ up down
↔️ left right
🔄 counterclockwise
➕ plus
➖ minus
➗ divide
✖️ multiply
♾️ infinity forever
💲 dollar
💱 currency exchange
™️ trademark
©️ copyright
®️ registered
〰️ wavy dash
➰ curly loop
✔️ check mark
☑️ check box
🔘 radio button
🔴 red circle
🟠 orange circle
🟡 yellow circle
🟢 green circle
🔵 blue circle
🟣 purple circle
⚫ black circle
⚪ white circle
🟤 brown circle
🔺 red triangle
🔻 red triangle down
🔸 orange diamond
🔹 blue diamond
🟥 red square
🟧 orange square
🟨 yellow square
🟩 green square
🟦 blue square
🟪 purple square
⬛ black square
⬜ white square
🔈 speaker
🔇 mute
🔉 speaker medium
🔊 speaker loud
🃏 joker
🀄 mahjong
🎴 flower cards
👁️‍🗨️ eye speech bubble
🕐 one oclock
🕒 three oclock
🕕 six oclock
🕘 nine oclock
🕛 twelve oclock`,
  flags: `
🏳️ white flag
🏴 black flag
🏁 chequered flag finish
🚩 red flag
🏳️‍🌈 rainbow flag pride
🏴‍☠️ pirate flag
🇳🇬 nigeria naija
🇬🇭 ghana
🇰🇪 kenya
🇿🇦 south africa
🇪🇬 egypt
🇲🇦 morocco
🇸🇳 senegal
🇨🇲 cameroon
🇺🇬 uganda
🇹🇿 tanzania
🇪🇹 ethiopia
🇺🇸 usa united states america
🇬🇧 uk united kingdom britain
🇨🇦 canada
🇮🇪 ireland
🇫🇷 france
🇩🇪 germany
🇮🇹 italy
🇪🇸 spain
🇵🇹 portugal
🇳🇱 netherlands
🇧🇪 belgium
🇨🇭 switzerland
🇸🇪 sweden
🇳🇴 norway
🇩🇰 denmark
🇫🇮 finland
🇵🇱 poland
🇺🇦 ukraine
🇷🇺 russia
🇹🇷 turkey
🇸🇦 saudi arabia
🇦🇪 uae emirates
🇮🇳 india
🇵🇰 pakistan
🇨🇳 china
🇯🇵 japan
🇰🇷 korea
🇵🇭 philippines
🇮🇩 indonesia
🇦🇺 australia
🇳🇿 new zealand
🇧🇷 brazil
🇦🇷 argentina
🇲🇽 mexico
🇨🇴 colombia
🇯🇲 jamaica`,
}

export const CATEGORIES = [
  { key: 'recent', icon: '🕘', label: 'Recent' },
  { key: 'smileys', icon: '😀', label: 'Smileys' },
  { key: 'people', icon: '👋', label: 'People' },
  { key: 'animals', icon: '🐻', label: 'Animals & nature' },
  { key: 'food', icon: '🍔', label: 'Food & drink' },
  { key: 'activities', icon: '⚽', label: 'Activities' },
  { key: 'travel', icon: '🚗', label: 'Travel & places' },
  { key: 'objects', icon: '💡', label: 'Objects' },
  { key: 'symbols', icon: '💜', label: 'Symbols' },
  { key: 'flags', icon: '🏳️', label: 'Flags' },
]

// { smileys: [{ e: '😀', k: 'grin happy smile' }, …], … }
export const EMOJIS = Object.fromEntries(
  Object.entries(RAW).map(([key, block]) => [
    key,
    block
      .trim()
      .split('\n')
      .map((line) => {
        const space = line.indexOf(' ')
        return { e: line.slice(0, space), k: line.slice(space + 1) }
      }),
  ]),
)
