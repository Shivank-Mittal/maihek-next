import { description } from "@/components/chart-area-interactive";

const data = {
  restaurant: "Maihak",
  address: "102, Rue Jean Jaurès - 94800 Villejuif",
  contact: ["01 49 58 84 00"],
  hours: "Ouvert 7J/7 de 12h00 à 14h30 et de 19h00 à 23h00",
  menu: {
    "Entrées Beignets": [
      { name: "Onion Bhaji", description: "Beignets d'oignons", price: 5.0 },
      { name: "Samosa Veg (2 pièces)", description: "Chaussons de légumes", price: 5.5 },
      {
        name: "Samosa Viande",
        description: "Chaussons à la viande hachée, petits pois",
        price: 6.5,
      },
      { name: "Fish Pakora (6 pièces)", description: "Beignets de poisson", price: 6.0 },
      { name: "Golden Chicken (6 pièces)", description: "Poulet croustillant", price: 6.5 },
      {
        name: "Mix Pakora",
        description: "Beignets de pomme de terre, chou-fleur, oignons, crevettes",
        price: 7.0,
      },
      {
        name: "Crevettes Pakora (6 pièces)",
        description: "Beignets de pomme de terre, chou-fleur, oignons, crevettes",
        price: 8.0,
      },
      {
        name: "Soupe Lentilles",
        description: "Soupe de lentilles, épices indiennes, coriandre fraîche",
        price: 6.5,
      },
      {
        name: "Poulet Soupe",
        description: "Soupe au citron et poulet avec des épices indiennes",
        price: 6.5,
      },
    ],
    "Entrées Grillades": [
      {
        name: "Reshmi Kabab",
        description: "Blancs de poulet hachés et grillés, épices indiennes",
        price: 6.5,
      },
      {
        name: "Sheekh Kabab",
        description: "Viande d'agneau hachée grillée, herbes fraîches",
        price: 7.0,
      },
      { name: "Chicken Tikka", description: "Morceaux de poulet marinés, grillés", price: 7.0 },
      { name: "Agneau Tikka", description: "Morceaux d'agneau marinés, grillés", price: 8.0 },
      { name: "Saumon Tikka", description: "Saumon grillé, épices indiennes", price: 9.0 },
      { name: "Bara Kabab", description: "Côtelettes d'agneau grillées", price: 10.0 },
      {
        name: "Mixte Grill (pour 2 personnes)",
        description: "Poulet, agneau, gambas, poissons cuits au tandoor",
        price: 25.0,
      },
      {
        name: "Gambas Tandoori",
        description: "Gambas grillées aux épices indiennes – servi avec naan au fromage",
        price: 19.0,
      },
    ],
    Salades: [
      {
        name: "Raita",
        description: "Yaourt nature, concombre, tomate, carotte râpée, coriandre",
        price: 4.0,
      },
      { name: "Raita Boondi", description: "Yaourt nature, boules de pois chiche", price: 4.5 },
      {
        name: "Aloo Tikki",
        description: "Boule de pomme de terre avec sauce menthe, tamarin et raita",
        price: 5.0,
      },
      {
        name: "Dahi Bhalla",
        description: "Beignet des lentilles arrosé avec yaourt et sauce tamarin",
        price: 6.0,
      },
      {
        name: "Salade Poulet",
        description: "Salade verte, poulet, concombre, tomates, coriandre fraîche",
        price: 6.0,
      },
      {
        name: "Prawn Chaat",
        description:
          "Crevettes garnies d’une salade composée de tomate, concombre, poivron, herbes fraîches, crème fraîche",
        price: 7.0,
      },
    ],
    Pains: [
      {
        name: "Papadam",
        description: "Galette de farine du pois chiche avec du chutney",
        price: 1.0,
      },
      { name: "Roti", description: "Galette farine complète", price: 2.5 },
      {
        name: "Naan Nature",
        description: "Boule de pomme de terre avec sauce menthe, tamarin et raita",
        price: 3.0,
      },
      { name: "Butter Naan", description: "Nan au beurre", price: 3.0 },
      { name: "Cheese Naan", description: "Nan au fromage", price: 4.0 },
      { name: "Garlic Naan", description: "Nan à l’ail", price: 3.0 },
      { name: "Paratha", description: "Galette à base de farine du blé", price: 4.0 },
      { name: "Garlic Cheese Naan", description: "Pain à l’ail et au fromage", price: 5.0 },
      { name: "Keema Naan", description: "Pain farci à la viande d’agneau", price: 4.5 },
      { name: "Masala Kulcha", description: "Pain aromatisé aux légumes", price: 4.0 },
      { name: "Chocolat Naan", description: "Pain au Nutella", price: 4.5 },
    ],
    "Riz Basmati": [
      { name: "Riz Basmati", description: "Riz nature", price: 4.0 },
      {
        name: "Green Peas Pulao",
        description: "Riz avec petits pois et coriandre fraîche",
        price: 4.0,
      },
      {
        name: "Kashmiri Riz",
        description: "Riz à la cannelle, graines de cumin, amande et fruits secs",
        price: 4.5,
      },
      {
        name: "Egg Riz",
        description: "Riz aux œufs façon omellette et coriandre fraîche",
        price: 5.0,
      },
    ],
    Biryani: [
      { name: "Légumes Biryani", description: "Légumes", price: 11.0 },
      { name: "Poulet Biryani", description: "Poulet", price: 12.0 },
      { name: "Agneau Biryani", description: "Agneau", price: 13.0 },
      { name: "Crevettes Biryani", description: "Crevettes", price: 14.0 },
      { name: "Biryani Maihak", description: "Poulet, agneau, crevettes, légumes", price: 15.0 },
    ],
    "Plats Légumes": [
      {
        name: "Dal Tarka",
        description: "Lentilles jaunes cuites avec herbes et aromates de l’Inde",
        price: 8.0,
      },
      {
        name: "Veg Korma",
        description:
          "Légumes variés, crème fraîche, amandes, raisins secs, coriandre, herbes fraîches",
        price: 8.0,
      },
      {
        name: "Khumbh Bhajee",
        description: "Champignons frais, oignons, coriandre fraîche",
        price: 8.0,
      },
      {
        name: "Chana Masala",
        description: "Pois chiches préparés avec coriandre fraîche",
        price: 8.0,
      },
      { name: "Bombay Aloo", description: "Pommes de terre, pois, sauce curry", price: 9.0 },
      {
        name: "Aloo Mattar",
        description: "Petits pois, pommes de terre, sauce épices douces",
        price: 9.0,
      },
      {
        name: "Baighan Bharata",
        description: "Aubergine grillée, tomate, oignons, coriandre fraîche",
        price: 9.0,
      },
      {
        name: "Shahi Paneer",
        description: "Fromage maison avec sauce curry, crème, épices indiennes",
        price: 9.0,
      },
      {
        name: "Palak Paneer",
        description: "Épinards hachés au fromage maison (peu relevé)",
        price: 9.0,
      },
      {
        name: "Kadai Paneer",
        description: "Fromage maison, poivrons, tomates, oignons et coriandre fraîche",
        price: 9.0,
      },
    ],
    "Plats Poulet": [
      {
        name: "Poulet Tikka Masala",
        description: "Blancs de poulet grillés, sauce au curry, crème, beurre",
        price: 13.0,
      },
      {
        name: "Poulet Shai Korma",
        description:
          "Blancs de poulet, sauce aux fruits secs (amande, noix de cajou, raisins secs) Spécialité du Chef",
        price: 13.0,
      },
      { name: "Butter Chicken", description: "Poulet grillé, sauce tomate, crème", price: 13.0 },
      {
        name: "Chili Chicken",
        description: "Blancs de poulet grillés, sauce au tomate, crème fraîche",
        price: 12.5,
      },
      {
        name: "Poulet Pistashwala",
        description: "Blancs de poulet mijotés avec pistaches broyées et crème",
        price: 12.0,
      },
      { name: "Poulet Mughlai", description: "Poulet au curry, oignons, œufs durs", price: 12.0 },
      { name: "Poulet Saag", description: "Poulet aux épinards hachés", price: 11.5 },
      {
        name: "Poulet Vindaloo",
        description: "Curry de poulet, pommes de terre, épices indiennes (relevé)",
        price: 11.0,
      },
      {
        name: "Poulet Curry",
        description: "Curry de poulet traditionnel, coriandre fraîche",
        price: 11.0,
      },
    ],
    "Plats Agneau": [
      {
        name: "Agneau Tikka Masala",
        description: "Agneau grillé, sauce curry, crème, beurre, épices indiennes",
        price: 13.5,
      },
      {
        name: "Agneau Shai Korma",
        description:
          "Agneau, lait de coco, raisins secs, coriandre fraîche, fruits secs (peu épicé) Spécialité du Chef",
        price: 13.5,
      },
      {
        name: "Agneau Baigan",
        description: "Agneau préparé avec aubergines, coriandre fraîche",
        price: 13.5,
      },
      {
        name: "Agneau Maihak",
        description: "Agneau au curry épicé, sauce tomate et amandes (relevé)",
        price: 13.5,
      },
      { name: "Agneau Saag", description: "Agneau aux épinards", price: 13.0 },
      {
        name: "Agneau Rada Khumbe",
        description:
          "Agneau mijoté, champignons aux feuilles de fenouil, coriandre, ail, gingembre",
        price: 13.5,
      },
      {
        name: "Agneau Vindaloo",
        description: "Curry d’agneau, pommes de terre, épices indiennes (relevé)",
        price: 12.5,
      },
      {
        name: "Agneau Curry",
        description: "Curry d’agneau traditionnel, coriandre fraîche",
        price: 12.0,
      },
    ],
    "Plats Poissons ou Crevettes": [
      {
        name: "Poisson Curry",
        description: "Curry de poisson (Colin d'Alaska), coriandre fraîche",
        price: 11.0,
      },
      {
        name: "Poisson Masala",
        description: "Poisson (Colin d'Alaska), tomates, coriandre fraîche",
        price: 12.0,
      },
      {
        name: "Poisson Malabri",
        description: "Poisson, sauce au curry épicée, lait de coco",
        price: 12.5,
      },
      {
        name: "Poisson Vindaloo",
        description: "Poisson, pommes de terre, épices indiennes (relevé)",
        price: 12.0,
      },
      {
        name: "Saumon Tikka Masala",
        description: "Saumon grillé aux épices indiennes",
        price: 18.0,
      },
      {
        name: "Crevettes Masala",
        description: "Crevettes au curry moyennement épicées, herbes fraîches",
        price: 13.5,
      },
      {
        name: "Crevettes Madras",
        description: "Crevettes au curry sauce Madras (relevé)",
        price: 13.0,
      },
      {
        name: "Gambas Curry",
        description: "Gambas accommodées à la sauce curry, coriandre fraîche (moyennement relevé)",
        price: 17.0,
      },
      {
        name: "Gambas Tikka Masala",
        description: "Gambas avec une sauce curry, crème, beurre, épices indiennes",
        price: 18.5,
      },
      {
        name: "Gambas Korma",
        description:
          "Spécialité du Chef – idéal pour les enfants Gambas préparées avec de la crème, noix de coco, raisins secs, cumin, gingembre (peu relevé)",
        price: 17.5,
      },
      {
        name: "Saint Jacques Masala",
        description:
          "Spécialité du Chef – Saint Jacques grillés, pommes de terre, lait de coco, tomates, coriandre fraîche (peu épicé)",
        price: 18.5,
      },
    ],
    Desserts: [
      { name: "Halwa", description: "Semoule, sucre, beurre, lait, noix de coco", price: 4.0 },
      { name: "Gulab Jamun", description: "Boule de semoule pochée au sirop de rose", price: 5.0 },
      { name: "Kulfi Pistache", description: "Glace pistache fait maison", price: 5.5 },
      { name: "Kulfi Mango", description: "Glace mangue fait maison", price: 6.0 },
    ],
    Boissons: [
      {
        name: "Lassi",
        variations: ["salé", "nature", "menthe", "sucré", "rose", "mangue"],
        price: 4.5,
      },
      { name: "Coca Cola 33cl", price: 2.0 },
      { name: "Orangina 33cl", price: 1.5 },
      { name: "Coca 1.5L", price: 4.5 },
      { name: "Bière Indienne 33cl", price: 4.0 },
    ],
    Vins: [
      { name: "Cuvée Maison", sizes: { "37.5cl": 12.0, "75cl": 18.0 } },
      { name: "Cabernet Shiraz (Rouge ou Rosé)", description: "75cl", price: 30.0 },
    ],
    Menus: [
      {
        name: "Menu Maihak Bowl",
        includes: ["Agneau Curry", "Riz", "Naan Fromage", "1 Boisson 33cl"],
        price: 17.0,
      },
    ],
  },
};
