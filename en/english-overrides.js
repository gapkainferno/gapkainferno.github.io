/**
 * english-overrides.js
 * 
 * ============================================================
 * ЯК ЦЕ ПРАЦЮЄ:
 * ============================================================
 * 1. Кореневий products.js завантажується першим — він містить
 *    ВСІ товари з українськими назвами/описами (єдине джерело).
 * 
 * 2. Цей файл завантажується після нього і ПЕРЕЗАПИСУЄ
 *    поля name, description, searchName, meta, heatLevel, specs
 *    на англійські версії.
 * 
 * 3. Коли додаєте НОВИЙ товар:
 *    - Додаєте його в кореневий products.js (як завжди)
 *    - Додаєте сюди його англійський переклад
 *    - БІЛЬШЕ НІДЕ нічого міняти не треба!
 * ============================================================
 */


// ═══════════════════════════════════════════════════════════════
// НАЛАШТУВАННЯ ВАЛЮТ (вимкнено повністю; показуємо UAH як в укр. версії)
// ═══════════════════════════════════════════════════════════════
window.IS_ENGLISH = true;
window.PRICE_CONVERSION_ENABLED = false;
window.CURRENCY_CONFIG = {
    UAH_PER_USD: 20.5,
    UAH_PER_EUR: 25,
    symbols: { USD: '$', EUR: '€' }
};

window.setPriceConversionEnabled = function() {
    window.PRICE_CONVERSION_ENABLED = false;
    return false;
};

/**
 * Повертає ціну тільки в UAH для англійської версії.
 * Конверсію вимкнено повністю, щоб не плутати потік цін.
 */
window.formatDualCurrency = function(priceUAH) {
    return `${Number(priceUAH).toFixed(2)} ₴`;
};

/**
 * Формат ціни для англійської версії — тільки UAH, як в українській.
 */
window.formatEnglishPrice = function(priceUAH, suffix = '') {
    return `${Number(priceUAH).toFixed(2)} ₴${suffix}`;
};

(function() {
    // ═══════════════════════════════════════════════════════════════
    // АНГЛІЙСЬКІ ПЕРЕКЛАДИ ТОВАРІВ
    // Додавайте нові товари сюди в тому ж порядку, що в products.js
    // ═══════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════
    // АНГЛІЙСЬКІ ПЕРЕКЛАДИ ТОВАРІВ
    // Додавайте нові товари сюди в тому ж порядку, що в products.js
    // ═══════════════════════════════════════════════════════════════

    const englishOverrides = {
        "habaneroredsavina": {
            name: "Habanero Red Savina Seeds",
            searchName: "Habanero Red Savina, habanero red, savina, red savina seeds, superhot seeds",
            heatLevel: "🔥 🔥  High (350,000-577,000 SHU)",
            metaDescription: "Buy Habanero Red Savina seeds. High heat (up to 577,000 SHU) with tropical aroma. Best choice for hot sauces from Gapka Homestead Inferno.",
            description: `<b>Habanero Red Savina</b> is not just a pepper — it's a living legend that proudly held the crown of the world's hottest pepper for 12 consecutive years. Forget about fleeting heat — Savina plays the long game.
            <br><br>
            First, it will enchant you with its <b>distinct tropical aroma</b> with notes of apricot and fresh flowers, and then, when you let your guard down, a velvety wave of heat rolls in, keeping you on edge much longer than you expected. Deceptive, elegant, as befits a true champion. This is the perfect base for signature sauces where character matters as much as the punch.
            <br><br>
            The plant is compact yet extremely productive, literally covered with fiery "lanterns." Habanero Red Savina seeds from Gapka Homestead Inferno are authentic genetics, not diluted by cross-pollination, guaranteeing you the true taste of a legend.`,
            growTip: "Red Savina is a sprinter. It can grow very fast, but for the fruits to reach their rightful 500,000+ SHU, the plant needs potassium stress. Give it plenty of sun and don't overwater during the ripening stage.",
            meta: {
                count: "5 seeds (+ farm bonus)",
                pack: "Zip-lock bag with label",
                year: "2026"
            },
            specs: {
                maturity: "90-100 days",
                height: "60-80 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "carolinareaperred": {
            name: "Carolina Reaper Red Seeds",
            searchName: "Carolina Reaper, reaper, carolina, reaper seeds, Guinness world record, hottest pepper",
            heatLevel: "☠️ EXTREME (1,500,000 – 2,200,000+ SHU)",
            metaDescription: "Carolina Reaper Red seeds — the hottest pepper in the world (2.2M+ SHU). Official Guinness World Record holder. Order with delivery across Ukraine from Gapka Homestead Inferno.",
            description: `<b>Carolina Reaper Red</b> is not just a pepper — it's the official Guinness World Record holder and a living symbol of chilihead culture. Bred by the legendary Ed Currie, this variety is a true firestorm trapped in a fruit with a menacing "scorpion tail."
            <br><br>
            Its bright red, wrinkled skin hides a concentration of capsaicin that borders on the limits of human endurance (up to 2,200,000 SHU). A moment before the "atomic reaction" begins in your mouth, you'll catch sweet citrus and cherry notes. This is a pepper for professionals, for those ready to test their limits.
            <br><br>
            Carolina Reaper Red seeds from Gapka Homestead Inferno will help you grow strong plants that will become the pride of your collection. The Reaper loves sun, stable warmth, and quality care, rewarding you with a harvest of fruits that make the world tremble. Ready to meet the legend?`,
            growTip: "The Reaper grows slowly, like true aristocracy. Sow it when snow is still on the ground (January), otherwise you'll see the harvest when snow falls again. ALWAYS wear gloves. No, seriously. If you decide to rub your eye or (God forbid) go to the bathroom after cutting the Reaper — you'll learn a lot of new and painful things about life.",
            meta: { count: "5 seeds", pack: "Zip", year: "2026" },
            specs: {
                maturity: "100-120 days (late)",
                height: "90-120 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "habanerodominicared": {
            name: "Habanero Dominica Red Seeds",
            searchName: "Habanero Dominica, habanero dominica red, habanero red, Caribbean pepper",
            heatLevel: "🔥 🔥  High (100,000-250,000 SHU)",
            metaDescription: "Buy Dominica Red seeds. Classic Habanero with Caribbean character and fruity-smoky profile. High yield and excellent taste from Gapka Homestead Inferno.",
            description: `<b>Habanero Dominica Red</b> is a true treasure of the Caribbean basin, offering the classic Habanero taste with a deep, multifaceted aroma.
            <br><br>
            This variety stands out with its powerful <b>fruity-smoky profile</b>, which is ideal for creating fermented sauces thanks to its thick walls. The plant is extremely productive, and the fruits have the characteristic "lantern" shape, adding aesthetics to your garden. Habanero Dominica Red seeds from Gapka Homestead Inferno are your ticket to authentic Caribbean flavors.`,
            growTip: "Dominica Red loves warmth and patience. Give it a stable temperature and don't rush to harvest — the longer the fruit hangs, the richer the aroma becomes.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "85-100 days",
                height: "50-70 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "habanerochocolate": {
            name: "Habanero Chocolate Seeds",
            searchName: "Habanero Chocolate, chocolate habanero, brown habanero, exotic pepper seeds",
            heatLevel: "🔥 🔥  High (350,000-450,000 SHU)",
            metaDescription: "Buy Habanero Chocolate seeds. Unique chocolate shade, rich earthy-sweet flavor with smoky notes. Elite genetics from Gapka Homestead Inferno.",
            description: `<b>Habanero Chocolate</b> is the aristocrat of the Habanero world. Its unusual chocolate-brown color hints at the depth of flavor hidden inside.
            <br><br>
            This variety offers a unique <b>earthy-sweet flavor profile</b> with smoky and nutty undertones, which is why it's so valued by chefs and sauce makers. The heat builds slowly and envelopingly, leaving a long, pleasant aftertaste. The plant is tall and productive, bearing fruits that look like small brown lanterns.
            <br><br>
            Habanero Chocolate seeds from Gapka Homestead Inferno are your chance to grow one of the most flavorful peppers in the world.`,
            growTip: "Chocolate Habanero loves space. Give it a pot of at least 5 liters and don't forget to feed it with potassium during fruiting — this enhances the unique flavor.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "90-110 days",
                height: "80-100 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "habaneroBigSun": {
            name: "Habanero Big Sun Seeds",
            searchName: "Habanero Big Sun, big sun habanero, large fruited habanero, yellow habanero",
            heatLevel: "🔥 🔥  High (200,000-350,000 SHU)",
            metaDescription: "Buy Habanero Big Sun seeds. Giant bright yellow fruits with classic Habanero heat. High yield and impressive fruit size from Gapka Homestead Inferno.",
            description: `<b>Habanero Big Sun</b> lives up to its name — its bright yellow, large fruits look like small suns in your garden.
            <br><br>
            This variety combines the <b>classic Habanero heat</b> with an impressive fruit size, making it not only a great ingredient for sauces but also a spectacular garden decoration. The plant is strong, productive, and surprisingly unpretentious for a Chinense variety. The flavor is classic Habanero — fruity, bright, with citrus notes.
            <br><br>
            Habanero Big Sun seeds from Gapka Homestead Inferno are the choice for those who want maximum yield with minimum fuss.`,
            growTip: "Big Sun loves freedom — plant it in a spacious container or open ground. The more space for the roots, the larger the fruits will be.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "85-100 days",
                height: "70-90 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "fataliiRed": {
            name: "Fatalii Red Seeds",
            searchName: "Fatalii Red, red fatalii, African pepper, citrus pepper, superhot seeds",
            heatLevel: "🔥 🔥 🔥  Very High (400,000-550,000 SHU)",
            metaDescription: "Buy Fatalii Red seeds. Rare red variety of the legendary African pepper with citrus notes. Elite genetics from Gapka Homestead Inferno.",
            description: `<b>Fatalii Red</b> is a rare red variation of the legendary African pepper, known for its unique combination of extreme heat and bright citrus aroma.
            <br><br>
            Unlike the classic yellow Fatalii, the red version offers a <b>deeper, slightly sweeter flavor</b> with the same signature citrus notes but with a more complex aftertaste. The fruits are elongated, wrinkled, bright red — a real gem for collectors. The heat is intense but not brutal, with a pleasant warming character.
            <br><br>
            Fatalii Red seeds from Gapka Homestead Inferno are a rare find for true connoisseurs of African pepper genetics.`,
            growTip: "Fatalii loves heat but doesn't tolerate direct scorching sun all day. Partial shade during the hottest hours will help the plant reveal its full potential.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "80-95 days",
                height: "60-80 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "fataliiYellow": {
            name: "Fatalii Yellow Seeds",
            searchName: "Fatalii Yellow, yellow fatalii, African pepper, citrus habanero, superhot",
            heatLevel: "🔥 🔥 🔥  Very High (400,000-550,000 SHU)",
            metaDescription: "Buy Fatalii Yellow seeds. The legendary African pepper with extreme heat and bright lemon-citrus aroma. Authentic genetics from Gapka Homestead Inferno.",
            description: `<b>Fatalii Yellow</b> is the legendary African pepper that has won the hearts of chiliheads worldwide with its unique combination of extreme heat and bright citrus aroma.
            <br><br>
            This variety offers a <b>purely lemon-citrus flavor</b> that unfolds before the heat hits. The heat is intense, sharp, but clean — it doesn't linger painfully but leaves a pleasant citrus aftertaste. The fruits are elongated, wrinkled, bright yellow — very decorative. The plant is productive and relatively compact.
            <br><br>
            Fatalii Yellow seeds from Gapka Homestead Inferno are authentic African genetics for those who appreciate not just heat, but also flavor.`,
            growTip: "Fatalii is a heat lover. In our climate, it grows best in a greenhouse or on a sunny windowsill. Don't overwater — it prefers drying out between waterings.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "80-95 days",
                height: "60-80 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "bhutjolokiared": {
            name: "Ghost Pepper (Bhut Jolokia) Red Seeds",
            searchName: "Ghost Pepper, Bhut Jolokia, ghost pepper seeds, bhut jolokia seeds, naga jolokia, India pepper",
            heatLevel: "☠️ EXTREME (1,000,000 – 1,500,000+ SHU)",
            metaDescription: "Buy Ghost Pepper (Bhut Jolokia) Red seeds. The legendary Indian pepper, former Guinness record holder (1M+ SHU). Authentic genetics from Gapka Homestead Inferno.",
            description: `<b>Ghost Pepper (Bhut Jolokia) Red</b> — the legendary Indian pepper that changed the world of heat forever. The first pepper to break the 1,000,000 SHU barrier and hold the Guinness World Record.
            <br><br>
            Its <b>unique smoky-earthy flavor</b> with sweet undertones is unlike any other pepper. The heat builds slowly, starting with a warm wave that grows into an all-consuming fire. This is not just heat — this is a spiritual experience for true chiliheads. The fruits are elongated, wrinkled, with a characteristic "ghostly" appearance.
            <br><br>
            Ghost Pepper seeds from Gapka Homestead Inferno are authentic Indian genetics, the very line that made history.`,
            growTip: "Bhut Jolokia is a slow starter. Be patient in the first month — it seems to stand still, but at this time the root system is developing. Once it takes off, it will grow powerfully.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "110-130 days (late)",
                height: "90-120 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "morugascorpionred": {
            name: "Trinidad Moruga Scorpion Red Seeds",
            searchName: "Moruga Scorpion, Trinidad Scorpion, moruga scorpion red, scorpion pepper, superhot",
            heatLevel: "☠️☠️ EXTREME (1,200,000 – 2,000,000+ SHU)",
            metaDescription: "Buy Trinidad Moruga Scorpion Red seeds. One of the hottest peppers in the world (2M+ SHU). Former Guinness record holder. From Gapka Homestead Inferno.",
            description: `<b>Trinidad Moruga Scorpion Red</b> — the pepper that briefly held the title of the world's hottest, and for good reason. Its heat level is truly terrifying.
            <br><br>
            The <b>scorpion sting of this pepper</b> is not a metaphor — the heat hits instantly and intensely, with a fruity-sweet start that quickly turns into an all-consuming fire. The fruits are round, wrinkled, with a characteristic "scorpion tail" at the tip. The plant is powerful and productive.
            <br><br>
            Trinidad Moruga Scorpion Red seeds from Gapka Homestead Inferno are for those who are not afraid to face one of the hottest peppers on the planet.`,
            growTip: "The Scorpion loves heat and humidity. In dry air, it can drop flowers. Mist the plant occasionally or use a humidifier nearby.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "100-120 days",
                height: "80-100 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "nagajolokia": {
            name: "Naga Jolokia Red Seeds",
            searchName: "Naga Jolokia, naga red, naga jolokia red, Indian pepper, superhot seeds",
            heatLevel: "☠️ EXTREME (800,000 – 1,200,000+ SHU)",
            metaDescription: "Buy Naga Jolokia Red seeds. The legendary Indian pepper from the Naga family. Extreme heat with rich flavor. From Gapka Homestead Inferno.",
            description: `<b>Naga Jolokia Red</b> is a close relative of the famous Bhut Jolokia, sharing its extreme heat but with its own unique character.
            <br><br>
            This variety offers a <b>purer, sharper heat</b> compared to the Ghost Pepper, with less earthy notes and more fruity brightness. The fruits are elongated, bright red, with thin walls. The plant is tall and productive. The heat hits quickly and intensely, making it ideal for those who want maximum effect with minimum wait.
            <br><br>
            Naga Jolokia Red seeds from Gapka Homestead Inferno are authentic Naga genetics for true connoisseurs of Indian superhots.`,
            growTip: "Naga loves deep pots — its root system goes deep. A tall pot (at least 30 cm) will help the plant reach its full potential.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "100-120 days",
                height: "90-130 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "7potbrainstrainchocolate": {
            name: "7 Pot Brain Strain Chocolate Seeds",
            searchName: "7 Pot Brain Strain, brain strain chocolate, 7 pot chocolate, brain strain seeds, superhot",
            heatLevel: "☠️☠️ EXTREME (1,200,000 – 1,800,000+ SHU)",
            metaDescription: "Buy 7 Pot Brain Strain Chocolate seeds. Extreme heat with unique brain-like wrinkled texture. Rare chocolate variety from Gapka Homestead Inferno.",
            description: `<b>7 Pot Brain Strain Chocolate</b> — the name says it all: this pepper is so hot that one pod can season seven pots of stew, and its brain-like wrinkled surface is truly unique.
            <br><br>
            The <b>chocolate version</b> of this legendary variety offers a deeper, earthier flavor with sweet undertones, complemented by extreme heat that builds gradually but relentlessly. The fruits are medium-sized, heavily wrinkled, dark brown — a real work of art. The plant is productive and relatively compact.
            <br><br>
            7 Pot Brain Strain Chocolate seeds from Gapka Homestead Inferno are for collectors and extreme heat enthusiasts.`,
            growTip: "Brain Strain is sensitive to overwatering. Let the soil dry out completely between waterings — this stresses the plant and increases capsaicin production.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "100-120 days",
                height: "70-90 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "7potbrainstrainred": {
            name: "7 Pot Brain Strain Red Seeds",
            searchName: "7 Pot Brain Strain Red, brain strain red, 7 pot red, brain strain seeds, superhot",
            heatLevel: "☠️☠️ EXTREME (1,200,000 – 1,800,000+ SHU)",
            metaDescription: "Buy 7 Pot Brain Strain Red seeds. Extreme heat with unique brain-like texture. One of the most visually striking superhots from Gapka Homestead Inferno.",
            description: `<b>7 Pot Brain Strain Red</b> is the classic red version of this legendary superhot, known for its extreme heat and unmistakable brain-like wrinkled surface.
            <br><br>
            The <b>bright red color</b> and heavily textured surface make this pepper one of the most visually striking in any collection. The heat is intense, with a fruity start that quickly gives way to a powerful, long-lasting burn. The plant is productive and relatively easy to grow for a superhot.
            <br><br>
            7 Pot Brain Strain Red seeds from Gapka Homestead Inferno are a must-have for any serious chilihead collection.`,
            growTip: "This variety responds well to potassium fertilizers during fruiting — it enhances both yield and heat level.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "100-120 days",
                height: "70-90 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "7PotBrainStrainYellow": {
            name: "7 Pot Brain Strain Yellow Seeds",
            searchName: "7 Pot Brain Strain Yellow, brain strain yellow, 7 pot yellow, brain strain seeds, superhot",
            heatLevel: "☠️☠️ EXTREME (1,200,000 – 1,800,000+ SHU)",
            metaDescription: "Buy 7 Pot Brain Strain Yellow seeds. Rare yellow variant with extreme heat and unique brain-like texture. From Gapka Homestead Inferno.",
            description: `<b>7 Pot Brain Strain Yellow</b> is the rare yellow variant of the legendary Brain Strain, combining extreme heat with a bright, sunny appearance.
            <br><br>
            The <b>golden-yellow color</b> makes this pepper stand out even among other superhots. The flavor is slightly fruitier and brighter than the red version, with citrus notes complementing the intense heat. The wrinkled, brain-like texture is just as pronounced, making it a true collector's item.
            <br><br>
            7 Pot Brain Strain Yellow seeds from Gapka Homestead Inferno are a rare find for those who want something truly unique in their collection.`,
            growTip: "Yellow varieties often need more light than red ones. Give it the sunniest spot you have for the best color development.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "100-120 days",
                height: "70-90 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "7potbubblegumchocolate": {
            name: "7 Pot Bubblegum Chocolate Seeds",
            searchName: "7 Pot Bubblegum, bubblegum chocolate, 7 pot chocolate, bubblegum pepper, superhot",
            heatLevel: "☠️ EXTREME (800,000 – 1,200,000+ SHU)",
            metaDescription: "Buy 7 Pot Bubblegum Chocolate seeds. Unique chocolate superhot with sweet bubblegum-like aroma. Rare genetics from Gapka Homestead Inferno.",
            description: `<b>7 Pot Bubblegum Chocolate</b> — one of the most intriguing superhots, combining extreme heat with a surprisingly sweet, bubblegum-like aroma.
            <br><br>
            The <b>unique flavor profile</b> of this pepper is what makes it truly special. Before the heat hits, you'll experience a sweet, fruity aroma reminiscent of bubblegum, which then gives way to a powerful but clean heat. The fruits are medium-sized, wrinkled, dark chocolate brown. The plant is productive and vigorous.
            <br><br>
            7 Pot Bubblegum Chocolate seeds from Gapka Homestead Inferno are for those who appreciate the finer things in the world of extreme peppers.`,
            growTip: "This variety loves consistent warmth. Temperature fluctuations can cause flower drop, so keep it in a stable environment.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "90-110 days",
                height: "70-90 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "carolinareaperchocolate": {
            name: "Carolina Reaper Chocolate Seeds",
            searchName: "Carolina Reaper Chocolate, chocolate reaper, reaper chocolate, brown reaper, superhot",
            heatLevel: "☠️☠️ EXTREME (1,500,000 – 2,200,000+ SHU)",
            metaDescription: "Buy Carolina Reaper Chocolate seeds. Rare chocolate variant of the world's hottest pepper. Extreme heat with rich flavor. From Gapka Homestead Inferno.",
            description: `<b>Carolina Reaper Chocolate</b> — the rare chocolate variant of the world's hottest pepper, combining record-breaking heat with a rich, complex flavor.
            <br><br>
            The <b>chocolate coloration</b> comes with a deeper, earthier flavor profile compared to the red Reaper, with notes of dark chocolate and coffee complementing the fruity undertones. The heat is just as extreme as the red version — up to 2,200,000 SHU. The fruits have the characteristic "scorpion tail" and wrinkled texture.
            <br><br>
            Carolina Reaper Chocolate seeds from Gapka Homestead Inferno are a rare find for serious collectors and extreme heat enthusiasts.`,
            growTip: "Like the red Reaper, the chocolate version needs a long growing season. Start seeds in January for the best results in our climate.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "100-120 days (late)",
                height: "90-120 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "lemondrop": {
            name: "Lemon Drop (Aji Limon) Seeds",
            searchName: "Lemon Drop, Aji Limon, aji lemon, lemon drop pepper, citrus pepper, Peruvian pepper",
            heatLevel: "🔥  Medium (15,000-30,000 SHU)",
            metaDescription: "Buy Lemon Drop (Aji Limon) seeds. Bright citrus flavor with pleasant medium heat. Perfect for sauces and seasonings. From Gapka Homestead Inferno.",
            description: `<b>Lemon Drop (Aji Limon)</b> — a Peruvian variety that has won the hearts of chefs and home cooks alike with its bright, pure lemon flavor.
            <br><br>
            This pepper offers a <b>truly unique citrus taste</b> — it tastes like lemon, but with a pleasant warmth that enhances any dish. The heat is mild to medium, making it accessible to those who don't chase extreme heat. The fruits are elongated, bright yellow, very decorative. The plant is extremely productive — you'll have more peppers than you know what to do with.
            <br><br>
            Lemon Drop seeds from Gapka Homestead Inferno are a must-have for any culinary gardener.`,
            growTip: "Lemon Drop is one of the easiest superhots to grow. It's productive even in pots and forgiving of beginner mistakes. Perfect for first-time growers.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "70-85 days",
                height: "60-80 cm",
                species: "Capsicum Baccatum",
                yield: ""
            }
        },

        "ajimelocoton": {
            name: "Aji Melocoton Seeds",
            searchName: "Aji Melocoton, aji melocoton, peach aji, Peruvian pepper, fruity pepper",
            heatLevel: "🔥  Medium (15,000-30,000 SHU)",
            metaDescription: "Buy Aji Melocoton seeds. Unique Peruvian pepper with peach and tropical fruit aroma. Medium heat, exceptional flavor. From Gapka Homestead Inferno.",
            description: `<b>Aji Melocoton</b> — a rare Peruvian variety whose name translates to "Peach Aji," and it lives up to its name with a wonderful peachy, tropical fruit aroma.
            <br><br>
            This pepper offers a <b>truly unique flavor experience</b> — the fruity, peachy notes are unmistakable, making it perfect for fruit salsas, ceviche, and light sauces. The heat is mild to medium, pleasant and not overwhelming. The fruits are elongated, orange-yellow, very attractive. The plant is productive and vigorous.
            <br><br>
            Aji Melocoton seeds from Gapka Homestead Inferno are a rare find for those who appreciate flavor as much as heat.`,
            growTip: "Aji Melocoton loves warmth but appreciates afternoon shade in hot climates. Regular feeding with organic fertilizer enhances the fruity flavor.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "75-90 days",
                height: "70-90 cm",
                species: "Capsicum Baccatum",
                yield: ""
            }
        },

        "sugarrushstripey": {
            name: "Sugar Rush Stripey Seeds",
            searchName: "Sugar Rush Stripey, sugar rush striped, stripey pepper, ornamental pepper, baccatum",
            heatLevel: "🔥  Medium (15,000-30,000 SHU)",
            metaDescription: "Buy Sugar Rush Stripey seeds. Unique striped pepper with sweet flavor and medium heat. A true garden decoration. From Gapka Homestead Inferno.",
            description: `<b>Sugar Rush Stripey</b> — a stunningly beautiful pepper with unique striped fruits that look like candy, hence the name.
            <br><br>
            This variety offers a <b>sweet, fruity flavor</b> with pleasant medium heat. The fruits are elongated, with cream and red/purple stripes that make them look almost unreal. The plant is extremely productive and very ornamental — it will be the star of your garden. The flavor is sweet with a hint of citrus, perfect for fresh eating and salsas.
            <br><br>
            Sugar Rush Stripey seeds from Gapka Homestead Inferno are for those who want beauty and flavor in one package.`,
            growTip: "The striped pattern develops fully only in bright light. Give it maximum sun for the most dramatic coloration.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "75-90 days",
                height: "60-80 cm",
                species: "Capsicum Baccatum",
                yield: ""
            }
        },

        "monkeyfaceyellow": {
            name: "Monkey Face Yellow Seeds",
            searchName: "Monkey Face, monkey face yellow, ornamental pepper, exotic pepper, rare seeds",
            heatLevel: "🔥 🔥  High (50,000-100,000 SHU)",
            metaDescription: "Buy Monkey Face Yellow seeds. Exotic pepper with unique monkey face-shaped fruits. Rare ornamental variety from Gapka Homestead Inferno.",
            description: `<b>Monkey Face Yellow</b> — one of the most unusual peppers you'll ever grow, named for the unique shape of its fruits that resemble a monkey's face.
            <br><br>
            This <b>ornamental variety</b> is as productive as it is unusual. The bright yellow fruits with their distinctive "face" shape are a guaranteed conversation starter. The heat is medium-high, with a clean, sharp flavor. The plant is compact and very ornamental, perfect for container growing.
            <br><br>
            Monkey Face Yellow seeds from Gapka Homestead Inferno are for collectors and those who love the unusual.`,
            growTip: "This variety is perfect for pots — it stays compact and produces heavily even in limited space. A 3-liter pot is enough for a good harvest.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "80-95 days",
                height: "40-60 cm",
                species: "Capsicum Annuum",
                yield: ""
            }
        },

        "starfishred": {
            name: "Starfish (Starfish Flower) Seeds",
            searchName: "Starfish pepper, starfish flower, ornamental pepper, exotic pepper, rare seeds",
            heatLevel: "🔥 🔥  High (50,000-100,000 SHU)",
            metaDescription: "Buy Starfish pepper seeds. Unique star-shaped fruits with high heat. Rare ornamental variety from Gapka Homestead Inferno.",
            description: `<b>Starfish</b> — a pepper that looks like it came from another planet. Its unique star-shaped fruits are unlike any other pepper.
            <br><br>
            The <b>star-shaped pods</b> start green and ripen to bright red, creating a stunning visual display. The heat is high, with a clean, sharp flavor. The plant is compact and extremely ornamental, producing dozens of star-shaped fruits that look like flowers. A must-have for any pepper collection.
            <br><br>
            Starfish seeds from Gapka Homestead Inferno are for those who appreciate the unusual and beautiful.`,
            growTip: "Starfish is sensitive to cold. Wait until the soil is consistently warm before planting out. In our climate, it grows best in a greenhouse or pot that can be moved indoors.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "80-95 days",
                height: "40-60 cm",
                species: "Capsicum Annuum",
                yield: ""
            }
        },

        "peterpepper": {
            name: "Peter Pepper Red Seeds",
            searchName: "Peter Pepper, peter pepper red, phallic pepper, ornamental pepper, rare pepper",
            heatLevel: "🔥  Medium (10,000-30,000 SHU)",
            metaDescription: "Buy Peter Pepper Red seeds. Famous for its distinctive shape. Medium heat, great for sauces. Novelty variety from Gapka Homestead Inferno.",
            description: `<b>Peter Pepper Red</b> — perhaps the most famous novelty pepper, known worldwide for its distinctive and unmistakable shape.
            <br><br>
            Beyond its <b>famous appearance</b>, this pepper offers a pleasant medium heat and a sweet, slightly smoky flavor. The fruits are bright red when ripe, medium-sized, and the plant is productive and easy to grow. It's a great conversation starter and a fun addition to any garden.
            <br><br>
            Peter Pepper Red seeds from Gapka Homestead Inferno are for those with a sense of humor and a love for the unusual.`,
            growTip: "This variety is easy to grow and forgiving. It produces well in pots and is a great choice for beginners who want something fun.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "75-90 days",
                height: "50-70 cm",
                species: "Capsicum Annuum",
                yield: ""
            }
        },

        "jalapeno": {
            name: "Jalapeno Seeds",
            searchName: "Jalapeno, jalapeno seeds, classic jalapeno, Mexican pepper, medium heat",
            heatLevel: "🔥  Mild-Medium (2,500-8,000 SHU)",
            metaDescription: "Buy classic Jalapeno seeds. The world's most popular chili pepper. Medium heat, versatile use. From Gapka Homestead Inferno.",
            description: `<b>Jalapeno</b> — the world's most popular chili pepper, beloved for its versatility, pleasant heat, and rich flavor.
            <br><br>
            This <b>classic Mexican variety</b> is perfect for everything — from fresh salsas and stuffed peppers to pickling and smoking (chipotle). The heat is mild to medium, accessible to everyone. The fruits are thick-walled, dark green ripening to red, with a characteristic rounded tip. The plant is productive and reliable.
            <br><br>
            Jalapeno seeds from Gapka Homestead Inferno are a must-have for any kitchen garden.`,
            growTip: "For the best flavor, let some fruits ripen to red — they become sweeter and develop a richer, more complex taste. Green jalapenos are harvested early for that classic crisp texture.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "70-80 days",
                height: "50-70 cm",
                species: "Capsicum Annuum",
                yield: ""
            }
        },

        "tabasco": {
            name: "Tabasco Seeds",
            searchName: "Tabasco, tabasco pepper, tabasco seeds, Louisiana pepper, classic pepper",
            heatLevel: "🔥  Medium (30,000-50,000 SHU)",
            metaDescription: "Buy Tabasco pepper seeds. The original pepper for the famous Tabasco sauce. Medium heat, unique flavor. From Gapka Homestead Inferno.",
            description: `<b>Tabasco</b> — the legendary pepper that gave its name to the world-famous sauce. A piece of Louisiana history for your garden.
            <br><br>
            This variety is known for its <b>unique flavor profile</b> — juicy, bright, with a characteristic sharpness that makes Tabasco sauce so recognizable. The fruits are small, elongated, bright red, growing in clusters pointing upward. The heat is medium but distinctive. The plant is tall and productive.
            <br><br>
            Tabasco seeds from Gapka Homestead Inferno are for those who want to grow a piece of culinary history.`,
            growTip: "Tabasco plants can grow quite tall (up to 1.5 m). Provide support and a large pot if growing in containers. The upward-growing fruits are a unique sight.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "80-90 days",
                height: "100-150 cm",
                species: "Capsicum Frutescens",
                yield: ""
            }
        },

        "shishito": {
            name: "Shishito Seeds",
            searchName: "Shishito, shishito pepper, Japanese pepper, shishito seeds, mild pepper",
            heatLevel: "🌶️  Mild (50-200 SHU) — 1 in 10 is spicy!",
            metaDescription: "Buy Shishito pepper seeds. Popular Japanese variety. Mostly mild with occasional spicy surprises. Perfect for appetizers. From Gapka Homestead Inferno.",
            description: `<b>Shishito</b> — the beloved Japanese pepper that has taken the culinary world by storm. Mostly mild, with the occasional spicy surprise — it's like Russian roulette for your taste buds!
            <br><br>
            These <b>thin-walled, wrinkled peppers</b> are perfect for blistered shishitos — simply pan-fry with oil and salt for an addictive appetizer. About 1 in 10 peppers has a surprising kick, making every bite an adventure. The plant is extremely productive, producing dozens of fruits.
            <br><br>
            Shishito seeds from Gapka Homestead Inferno are a must-have for any food lover's garden.`,
            growTip: "Shishito is one of the easiest peppers to grow. It's productive even in cool summers and perfect for beginners. Harvest regularly for continuous production.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "60-70 days",
                height: "50-70 cm",
                species: "Capsicum Annuum",
                yield: ""
            }
        },

        "padron": {
            name: "Padron Seeds",
            searchName: "Padron, padron pepper, Spanish pepper, padron seeds, tapas pepper",
            heatLevel: "🌶️  Mild (500-2,500 SHU) — some are hot!",
            metaDescription: "Buy Padron pepper seeds. Famous Spanish tapas pepper. Mostly mild, some surprisingly hot. From Gapka Homestead Inferno.",
            description: `<b>Padron</b> — the famous Spanish pepper from Galicia, traditionally served as tapas: blistered in olive oil with sea salt.
            <br><br>
            The saying goes: "Os pementos de Padrón, uns pican e outros non" (Padron peppers, some are hot and some are not). Most are mild and sweet, but every so often one packs a surprising punch. This <b>element of surprise</b> is what makes them so fun to eat. The fruits are small, bright green, thin-walled.
            <br><br>
            Padron seeds from Gapka Homestead Inferno are for those who love good food and a little culinary adventure.`,
            growTip: "Padron is very productive and easy to grow. Harvest fruits when they are 3-5 cm long for the best flavor. The heat level can vary based on growing conditions — stress increases spiciness.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "65-75 days",
                height: "50-70 cm",
                species: "Capsicum Annuum",
                yield: ""
            }
        },

        "anchosanluis": {
            name: "Ancho San Luis Seeds",
            searchName: "Ancho San Luis, ancho pepper, poblano, Mexican pepper, mild pepper",
            heatLevel: "🌶️  Mild (1,000-2,000 SHU)",
            metaDescription: "Buy Ancho San Luis seeds. Classic Mexican pepper for chiles rellenos and mole sauces. Rich flavor, mild heat. From Gapka Homestead Inferno.",
            description: `<b>Ancho San Luis</b> — the classic Mexican pepper, known as Poblano when fresh and Ancho when dried. The heart of traditional Mexican cuisine.
            <br><br>
            This variety offers a <b>rich, earthy-sweet flavor</b> with notes of dried fruit and chocolate, especially when dried. The heat is very mild, making it accessible to everyone. The fruits are large, heart-shaped, dark green ripening to deep red. Perfect for chiles rellenos, mole sauces, and drying.
            <br><br>
            Ancho San Luis seeds from Gapka Homestead Inferno are for lovers of authentic Mexican cuisine.`,
            growTip: "For the best flavor, let the fruits fully ripen to red before harvesting and drying. The dried peppers (Ancho) have a much richer, more complex flavor than fresh green ones.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "70-85 days",
                height: "60-80 cm",
                species: "Capsicum Annuum",
                yield: ""
            }
        },

        "scotchbonnetyellow": {
            name: "Scotch Bonnet Yellow Seeds",
            searchName: "Scotch Bonnet, scotch bonnet yellow, Caribbean pepper, bonnet pepper, Jamaican pepper",
            heatLevel: "🔥 🔥 🔥  Very High (150,000-325,000 SHU)",
            metaDescription: "Buy Scotch Bonnet Yellow seeds. The soul of Caribbean cuisine. Fruity flavor with intense heat. Authentic genetics from Gapka Homestead Inferno.",
            description: `<b>Scotch Bonnet Yellow</b> — the soul of Caribbean cuisine, essential for jerk chicken, goat curry, and countless other island classics.
            <br><br>
            This variety is prized for its <b>unique fruity flavor</b> with notes of tropical fruit and citrus, combined with serious heat. The distinctive "bonnet" shape (flattened with folds) makes it easy to identify. The heat is intense but flavorful, building slowly and complementing the fruitiness. The plant is productive and vigorous.
            <br><br>
            Scotch Bonnet Yellow seeds from Gapka Homestead Inferno are authentic Caribbean genetics for those who love tropical heat.`,
            growTip: "Scotch Bonnet loves humidity. In our dry climate, regular misting helps with flower set. It also responds well to organic fertilizers.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "90-110 days",
                height: "70-90 cm",
                species: "Capsicum Chinense",
                yield: ""
            }
        },

        "giantrocotored": {
            name: "Giant Rocoto Red Seeds",
            searchName: "Giant Rocoto, rocoto red, rocoto pepper, manzano pepper, fuzzy leaf pepper, capsicum pubescens",
            heatLevel: "🔥 🔥  High (50,000-100,000 SHU)",
            metaDescription: "Buy Giant Rocoto Red seeds. Unique fuzzy-leaf pepper with black seeds. Cold tolerant, thick-walled, incredibly juicy. From Gapka Homestead Inferno.",
            description: `<b>Giant Rocoto Red</b> — a truly unique pepper from the Capsicum Pubescens species, distinguished by its fuzzy leaves and black seeds.
            <br><br>
            Rocotos are in a <b>league of their own</b> — they have thick, juicy walls (like a bell pepper), black seeds (unique among peppers), and can tolerate cooler temperatures than other hot peppers. The flavor is fruity and bright, with a pleasant heat that builds gradually. The fruits are large, apple-shaped, bright red.
            <br><br>
            Giant Rocoto Red seeds from Gapka Homestead Inferno are for those who want to grow something truly unique.`,
            growTip: "Rocoto is the only pepper species that can tolerate light frost. It actually prefers cooler nights (10-15°C) for fruit set. In hot summers, it may stop flowering until temperatures drop.",
            meta: { count: "5 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
            specs: {
                maturity: "100-120 days",
                height: "100-150 cm",
                species: "Capsicum Pubescens",
                yield: ""
            }
        },
    "zebrange": {
            name: "Zebrange Seeds",
            searchName: "Zebrange, zebrange, striped pepper, exotic pepper, ornamental pepper, baccatum",
            heatLevel: "🔥 Low (5,000 – 15,000 SHU)",
            metaDescription: "Buy Zebrange pepper seeds. Unique striped pepper with rich flavor. A standout in any garden. From Gapka Homestead Inferno.",
            description: `<b>Zebrange</b> is the choice for those seeking true exoticism and visual delight. This variety is a unique cross between Aji Fantasy and Christmas Bell, combining the best qualities of both.
            <br><br>
            Its standout feature is the incredible "tiger" stripes on its "cosmic bell"-shaped fruit. Zebrange has an exceptionally sweet flavor with vibrant notes of citrus and mango. It is the perfect pepper for fresh salads and is sure to impress your guests with its otherworldly appearance.
            <br><br>
           Zebrange seeds from Gapka Homestead Inferno guarantee a unique harvest.`,
            growTip: "This is a highly productive and resilient variety. The stripes on the fruit become distinct only at full maturity, so do not rush to harvest—allow the pattern to fully develop. Ensure it gets plenty of sunlight for vibrant coloration.",
            meta: { count: "15 seeds (+ farm bonus)", pack: "Paper envelope with label", year: "2026" },
            specs: {
                maturity: "85–95 days",
            height: "80–120 cm",
            species: "Capsicum baccatum",
            yield: ""
            }
    },
 
         "emerald_honey_97": {
             name: "Emerald Honey Seeds",
             searchName: "Emerald Honey, emerald honey tomato, green tomato, sweet tomato, GHI tomato",
             heatLevel: "🍅 Tomato",
             metaDescription: "Buy Emerald Honey seeds. Unique green-when-ripe tomato with honey-like sweetness and kiwi notes. A tropical dessert for your table. From Gapka Homestead Inferno.",
             description: `<b>Emerald Honey</b> — a unique green sweet tomato, a true honey with kiwi notes. Don't believe your eyes, believe the taste!
             <br><br>
             This tomato stays green but becomes soft when ripe. A true emerald dessert for your table. The main feature of this tomato is its incredible sweetness. The flavor is not tomato-like, but truly tropical, with light fruity notes. It's perfect for those looking for exotics or want to surprise guests with an unusual garnish.
             <br><br>
             Emerald Honey seeds from Gapka Homestead Inferno are your path to tropical flavors.`,
             growTip: "Be sure to stake and prune. To determine ripeness, don't wait for color change — just feel the fruit, it should become soft. Give it plenty of sun and regular watering.",
             meta: { count: "15 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
             isHot: false,
             isFlavor: "🌿 Tropical dessert",
             inStock: true,
             allowSale: true
         },
 
         "brandywine_pink": {
             name: "Brandywine Pink Tomato Seeds",
             searchName: "Brandywine, brandywine pink, heirloom tomato, beefsteak tomato, Amish tomato",
             heatLevel: "🍅 Tomato",
             metaDescription: "Buy Brandywine Pink tomato seeds. Legendary heirloom beefsteak tomato. Unmatched flavor, large fruits. From Gapka Homestead Inferno.",
             description: `<b>Brandywine Pink</b> — the legendary heirloom tomato that many consider the best-tasting tomato in the world.
             <br><br>
             This <b>Amish heirloom variety</b> has been passed down for generations for good reason — its flavor is simply unmatched. Large, pinkish-red beefsteak fruits with a rich, sweet, complex taste that defines what a tomato should be. The plant is indeterminate and productive, though the fruits take time to develop.
             <br><br>
             Brandywine Pink tomato seeds from Gapka Homestead Inferno are for those who appreciate the finest things in life.`,
             growTip: "Brandywine is a late variety that needs patience. In our climate, start seeds early (February-March) and provide consistent care for the best results.",
             meta: { count: "15 seeds (+ farm bonus)", pack: "Paper envelope with label", year: "2026" },
             specs: {
                 maturity: "85-100 days",
                 height: "150-200 cm (indeterminate)",
                 species: "Solanum Lycopersicum",
                 yield: ""
             }
         },
 
         "stupice_early": {
             name: "Stupice Early Tomato Seeds",
             searchName: "Stupice, stupice tomato, early tomato, Czech tomato, cold tolerant tomato",
             heatLevel: "🍅 Tomato",
             metaDescription: "Buy Stupice Early tomato seeds. Ultra-early Czech variety. Cold tolerant, productive, delicious. From Gapka Homestead Inferno.",
             description: `<b>Stupice</b> — an ultra-early Czech tomato variety that produces delicious fruits even in challenging conditions.
             <br><br>
             This <b>cold-tolerant variety</b> is perfect for our climate, producing sweet, flavorful fruits earlier than almost any other tomato. The fruits are medium-sized, red, with a classic tomato flavor. The plant is determinate and compact, making it perfect for containers and small gardens.
             <br><br>
             Stupice Early tomato seeds from Gapka Homestead Inferno are for those who want the earliest possible harvest.`,
             growTip: "Stupice is one of the few tomatoes that can be grown successfully in pots on a balcony. It's also more shade-tolerant than most tomatoes.",
             meta: { count: "15 seeds (+ farm bonus)", pack: "Paper envelope with label", year: "2026" },
             specs: {
                 maturity: "55-65 days (ultra-early)",
                 height: "60-90 cm (determinate)",
                 species: "Solanum Lycopersicum",
                 yield: ""
             }
         },
 
         "zagadka": {
             name: "Zagadka Tomato Seeds",
             searchName: "Zagadka, zagadka tomato, mystery tomato, Ukrainian tomato, early tomato",
             heatLevel: "🍅 Tomato",
             metaDescription: "Buy Zagadka tomato seeds. Ukrainian variety with excellent flavor. Reliable and productive. From Gapka Homestead Inferno.",
             description: `<b>Zagadka</b> — a reliable Ukrainian tomato variety that consistently produces delicious, medium-sized fruits.
             <br><br>
             This variety is known for its <b>excellent balance of sweetness and acidity</b>, making it perfect for fresh eating, salads, and processing. The plants are determinate and compact, making them ideal for gardens of any size. The fruits are round, red, and smooth.
             <br><br>
             Zagadka tomato seeds from Gapka Homestead Inferno are a reliable choice for any gardener.`,
             growTip: "Zagadka is very low-maintenance. It doesn't need extensive pruning or staking. Just plant, water, and enjoy the harvest.",
             meta: { count: "15 seeds (+ farm bonus)", pack: "Paper envelope with label", year: "2026" },
             specs: {
                 maturity: "65-75 days",
                 height: "50-70 cm (determinate)",
                 species: "Solanum Lycopersicum",
                 yield: ""
             }
         },
 
         "pinkgiant": {
             name: "Pink Giant Tomato Seeds",
             searchName: "Pink Giant, pink giant tomato, large tomato, beefsteak, Ukrainian tomato",
             heatLevel: "🍅 Tomato",
             metaDescription: "Buy Pink Giant tomato seeds. Large pink beefsteak tomatoes with sweet, rich flavor. From Gapka Homestead Inferno.",
             description: `<b>Pink Giant</b> — a variety that lives up to its name, producing impressively large pink fruits with a sweet, rich flavor.
             <br><br>
             The <b>giant pink fruits</b> can reach impressive sizes while maintaining excellent flavor. The flesh is meaty, with few seeds, making it perfect for slicing and fresh eating. The plant is indeterminate and needs support, but rewards you with a bountiful harvest of enormous tomatoes.
             <br><br>
             Pink Giant tomato seeds from Gapka Homestead Inferno are for those who believe bigger can also be better.`,
             growTip: "For the largest fruits, limit the plant to 3-4 main stems and remove excess flowers. Regular feeding is essential for these heavy producers.",
             meta: { count: "15 seeds (+ farm bonus)", pack: "Paper envelope with label", year: "2026" },
             specs: {
                 maturity: "110-120 days",
                 height: "170-200 cm (indeterminate)",
                 species: "Solanum Lycopersicum",
                 yield: ""
             }
         },
 
         "vedmezhalapa": {
             name: "Vedmezha Lapa (Bear Paw) Tomato Seeds",
             searchName: "Vedmezha Lapa, bear paw tomato, Ukrainian tomato, large tomato, beefsteak",
             heatLevel: "🍅 Tomato",
             metaDescription: "Buy Vedmezha Lapa (Bear Paw) tomato seeds. Ukrainian heirloom with large, ribbed fruits. Rich flavor. From Gapka Homestead Inferno.",
             description: `<b>Vedmezha Lapa (Bear Paw)</b> — a Ukrainian heirloom tomato named for its large, ribbed fruits that resemble a bear's paw.
             <br><br>
             This <b>unique Ukrainian variety</b> produces large, heavily ribbed fruits that are as distinctive as they are delicious. The flavor is rich, sweet, and complex — perfect for fresh eating and sauces. The plant is indeterminate and productive.
             <br><br>
             Vedmezha Lapa tomato seeds from Gapka Homestead Inferno are a piece of Ukrainian gardening heritage.`,
             growTip: "The ribbed fruits are prone to cracking in wet weather. Consistent watering and mulching help prevent this issue.",
             meta: { count: "15 seeds (+ farm bonus)", pack: "Paper envelope with label", year: "2026" },
             specs: {
                 maturity: "80-95 days",
                 height: "150-180 cm (indeterminate)",
                 species: "Solanum Lycopersicum",
                 yield: ""
             }
         },
 
         "opal_gem_120": {
             name: "Opal Gem Tomato Seeds",
             searchName: "Opal Gem, opal tomato, green tomato, emerald tomato, exotic tomato",
             heatLevel: "🍅 Tomato",
             metaDescription: "Buy Opal Gem tomato seeds. Unique green-when-ripe tomato with emerald color and exceptional sweetness. From Gapka Homestead Inferno.",
             description: `<b>Opal Gem</b> — a unique tomato that stays green when ripe, with a beautiful emerald hue and exceptional sweetness.
             <br><br>
             This <b>green-when-ripe variety</b> offers a unique flavor experience — sweet, with tropical fruit notes and a hint of citrus. The fruits are medium-sized, round, with a beautiful translucent green color. The plant is indeterminate and productive.
             <br><br>
             Opal Gem tomato seeds from Gapka Homestead Inferno are for those who want to try something truly different.`,
             growTip: "Don't wait for this tomato to turn red — it's ripe when it softens slightly and develops a translucent, emerald glow. The sugar content is highest at this stage.",
             meta: { count: "15 seeds (+ farm bonus)", pack: "Paper envelope with label", year: "2026" },
             specs: {
                 maturity: "70-85 days",
                 height: "150-180 cm (indeterminate)",
                 species: "Solanum Lycopersicum",
                 yield: ""
             }
         },
 
         "titan_red_814": {
             name: "Titan Red Tomato Seeds",
             searchName: "Titan Red, titan red tomato, large tomato, beefsteak, Ukrainian tomato",
             heatLevel: "🍅 Tomato",
             metaDescription: "Buy Titan Red tomato seeds. Large, meaty tomatoes with excellent flavor. Reliable and productive. From Gapka Homestead Inferno.",
             description: `<b>Titan Red</b> — a powerful tomato variety that produces large, meaty fruits with excellent flavor.
             <br><br>
             This variety is known for its <b>large, dense fruits</b> with few seeds and rich, classic tomato flavor. Perfect for slicing, sauces, and canning. The plant is determinate and manageable, making it a great choice for gardeners of all levels.
             <br><br>
             Titan Red tomato seeds from Gapka Homestead Inferno are a reliable choice for a bountiful harvest.`,
             growTip: "Titan Red is a determinate variety that doesn't need extensive pruning. Remove only the lower leaves to improve air circulation.",
             meta: { count: "15 seeds (+ farm bonus)", pack: "Paper envelope with label", year: "2026" },
             specs: {
                 maturity: "75-85 days",
                 height: "60-80 cm (determinate)",
                 species: "Solanum Lycopersicum",
                 yield: ""
             }
         },
 
         "sauceCoreHeat": {
             name: "Core Heat Hot Sauce",
             searchName: "Core Heat, core heat sauce, hot sauce, superhot sauce, Carolina Reaper sauce",
             heatLevel: "🔥🔥🔥 EXTREME",
             metaDescription: "Buy Core Heat hot sauce. Uncompromising blend of the world's hottest peppers. No preservatives, pure fire in a bottle. From Gapka Homestead Inferno.",
             description: `<b>Core Heat Hot Sauce</b> — the manifesto of true spiciness and our bestselling Inferno line. We created this sauce as an uncompromising blend of the world's hottest peppers: Carolina Reaper, Trinidad Scorpion, and Bhut Jolokia. This is pure fire energy, tamed in a bottle.
             <br><br>
             This <b>craft hot sauce</b> from Gapka Homestead Inferno is created for those who don't recognize compromises in flavor. Each drop explodes on the receptors, providing a steady and noble burn. It will be the perfect addition to juicy steaks, craft burgers, or as a secret ingredient for your marinades.
             <br><br>
             <b>Important:</b> No artificial preservatives, thickeners, or dyes — only natural vegetables and the power of nature. Core Heat is the base for those who want to experience the true character of Homestead Inferno. Try the legend for yourself!`,
             growTip: "We recommend adding drop by drop. Store in the refrigerator after opening. Shake well before use.",
             meta: {
                 count: "200 ml",
                 pack: "PET bottle",
                 year: "2026"
             }
         },
 
         "sauceNeonVibe": {
             name: "Neon Vibe Hot Sauce",
             searchName: "Neon Vibe, neon vibe sauce, habanero sauce, craft sauce, fruity sauce",
             heatLevel: "🔥🔥 High",
             metaDescription: "Buy Neon Vibe hot sauce. Fruity sweetness and neon heat. Natural craft sauce perfect for seafood and noodles. From Gapka Homestead Inferno.",
             description: `<b>Neon Vibe Hot Sauce</b> — a sauce-emotion. Bright fruity sweetness and fresh acidity instantly change into a spicy "neon" pulse.
             <br><br>
             This <b>habanero sauce</b> is best paired with seafood and Asian noodles. It's bright and appetizing, like a summer night. Only natural ingredients from Gapka Homestead Inferno farm, guaranteeing an unforgettable flavor experience.`,
             growTip: "We recommend adding drop by drop. Store in the refrigerator after opening.",
             meta: {
                 count: "200 ml",
                 pack: "PET bottle",
                 year: "2026"
             }
         },
 
         "sauceMildForest": {
             name: "Mild Forest Hot Sauce",
             searchName: "Mild Forest, mild forest sauce, jalapeno sauce, lemon sauce, mild hot sauce",
             heatLevel: "🔥 Medium",
             metaDescription: "Buy Mild Forest hot sauce. Balanced heat with jalapeno and lemon. Perfect for everyday use. From Gapka Homestead Inferno.",
             description: `<b>Mild Forest Hot Sauce</b> — a balanced blend of jalapeno heat and fresh lemon, with a hint of garlic and herbs.
             <br><br>
             This <b>craft sauce</b> offers a perfect balance of heat and flavor, making it ideal for everyday use. Great on tacos, eggs, grilled vegetables, or as a dipping sauce. The flavor is bright and herbaceous, with a clean, refreshing finish.
             <br><br>
             Mild Forest hot sauce from Gapka Homestead Inferno brings the taste of summer to your table year-round.`,
             growTip: "Store in a cool, dry place. Refrigerate after opening for best flavor. Shake well before use.",
             meta: {
                 count: "200 ml",
                 pack: "PET bottle",
                 year: "2026"
             }
         },
 
         "mongol_dwarf": {
             name: "Mongol Dwarf Tomato Seeds",
             searchName: "Mongol Dwarf, mongol dwarf tomato, dwarf tomato, low growing tomato, trailing tomato",
             heatLevel: "🍅 Tomato",
             metaDescription: "Buy Mongol Dwarf tomato seeds. A lazy gardener's dream: no staking or pruning needed. Cold and drought tolerant. From Gapka Homestead Inferno.",
             description: `<b>Mongol Dwarf</b> — a tomato for "lazy" gardeners that doesn't require staking or pruning. It's cold and drought tolerant.
             <br><br>
             Perfect for open ground, as it grows wide rather than up, hiding the harvest under the leaves. The fruits are large, red, and meaty.
             <br><br>
             This variety is extremely resilient to stress conditions: cold, drought, and disease. An ideal choice for open ground and busy gardeners. Mongol Dwarf tomato seeds from Gapka Homestead Inferno are your path to an easy and abundant harvest.`,
             growTip: "Be sure to mulch the soil under the bush with straw or agrofiber, as the fruits ripen while lying on the ground. Give it plenty of sun and regular watering.",
             meta: { count: "15 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
             specs: {
                 maturity: "90-100 days",
                 height: "20-30 cm (trailing)",
                 species: "Solanum lycopersicum",
                 yield: "up to 10 kg per sq m"
             }
         },
 
         "sgt_pepper_tomato": {
             name: "Sgt. Pepper Tomato Seeds",
             searchName: "Sgt. Pepper, sergeant pepper, sgt pepper tomato, anthocyanin tomato, heart shaped tomato",
             heatLevel: "🍅 Tomato",
             metaDescription: "Buy Sgt. Pepper tomato seeds. Striking anthocyanin variety with heart-shaped fruits and dark shoulders. From Gapka Homestead Inferno.",
             description: `<b>Sgt. Pepper</b> — a tomato that looks like it decided to become a rock star of the garden. Heart-shaped fruits combine pink-red flesh with dark anthocyanin shoulders that turn almost purple in the sun.
             <br><br>
             The flavor in Sgt. Pepper is sweet, rich, with a light fruity depth. This is a variety for fresh salads, beautiful slicing, and those moments when a tomato should be not just food, but a small event on the table.
             <br><br>
             Sgt. Pepper tomato seeds from Gapka Homestead Inferno are for those who love to grow not just a harvest, but character.`,
             growTip: "For the dark shoulders to show their maximum beauty, give the plant plenty of sun. Grow the bush in 1-2 stems, regularly tie it up and don't overdo nitrogen after flowering starts.",
             meta: { count: "15 seeds (+ farm bonus)", pack: "Zip-lock bag with label", year: "2026" },
             isNew: true,
             isFlavor: "🍅 Anthocyanin heart",
             inStock: true,
             allowSale: true
         },
        
         

     };

     
 
     // ═══════════════════════════════════════════════════════════════
     // ЗАСТОСУВАННЯ ПЕРЕКЛАДІВ
     // ═══════════════════════════════════════════════════════════════
 
     // Чекаємо поки allProducts завантажиться з products.js
     function applyEnglishOverrides() {
         if (typeof allProducts === 'undefined') {
             // Якщо allProducts ще не завантажено, пробуємо через 100мс
             setTimeout(applyEnglishOverrides, 100);
             return;
         }
 
         for (const [id, overrides] of Object.entries(englishOverrides)) {
             if (allProducts[id]) {
                 Object.assign(allProducts[id], overrides);
             }
         }

        Object.values(allProducts).forEach(product => {
            if (product.category === 'seeds' && /\bSHU\b/i.test(product.heatLevel || '') && product.meta?.count) {
                product.meta.count = '8 seeds (+ farm bonus)';
            }
        });
 
         console.log('🌐 English overrides applied for', Object.keys(englishOverrides).length, 'products');
     }
 
     // Запускаємо після завантаження DOM
     if (document.readyState === 'loading') {
         document.addEventListener('DOMContentLoaded', applyEnglishOverrides);
     } else {
         applyEnglishOverrides();
     }
 })();
