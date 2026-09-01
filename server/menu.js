// Menú de Quinoa / Quinoa's menu.
//
// Cada texto visible va en los dos idiomas: { en: "...", es: "..." }
// Every visible text is bilingual: { en: "...", es: "..." }
//
// Los precios están en centavos (así trabaja Stripe). Ej: 1250 = $12.50
// Prices are in cents (that's how Stripe works). E.g. 1250 = $12.50
// La moneda es el dólar canadiense ("cad") / Currency is Canadian dollars.

module.exports = {
  currency: "cad",
  categories: [
    {
      id: "bowls",
      name: { en: "Quinoa Bowls", es: "Bowls de Quinoa" },
      items: [
        {
          id: "bowl-clasico",
          name: { en: "Classic Quinoa Bowl", es: "Bowl Clásico Quinoa" },
          description: {
            en: "Quinoa, avocado, cherry tomatoes, cucumber, chickpeas and lemon dressing.",
            es: "Quinoa, aguacate, tomate cherry, pepino, garbanzos y aderezo de limón."
          },
          price: 1050,
          image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80"
        },
        {
          id: "bowl-pollo",
          name: { en: "Grilled Chicken Bowl", es: "Bowl de Pollo a la Parrilla" },
          description: {
            en: "Quinoa, grilled chicken, corn, pico de gallo and chipotle dressing.",
            es: "Quinoa, pollo grillado, elote, pico de gallo y aderezo chipotle."
          },
          price: 1250,
          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80"
        },
        {
          id: "bowl-vegano",
          name: { en: "Andean Vegan Bowl", es: "Bowl Vegano Andino" },
          description: {
            en: "Tricolour quinoa, roasted sweet potato, kale, black beans and tahini dressing.",
            es: "Quinoa tricolor, camote asado, kale, frijol negro y aderezo tahini."
          },
          price: 1150,
          image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80"
        },
        {
          id: "bowl-salmon",
          name: { en: "Salmon Bowl", es: "Bowl de Salmón" },
          description: {
            en: "Quinoa, seared salmon, edamame, carrot and sesame-ginger dressing.",
            es: "Quinoa, salmón sellado, edamame, zanahoria y aderezo de sésamo-jengibre."
          },
          price: 1450,
          image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80"
        }
      ]
    },
    {
      id: "ensaladas",
      name: { en: "Salads", es: "Ensaladas" },
      items: [
        {
          id: "ensalada-quinoa-frutos",
          name: { en: "Quinoa & Nut Salad", es: "Ensalada de Quinoa y Frutos Secos" },
          description: {
            en: "Quinoa, baby spinach, walnuts, dried cranberries and goat cheese.",
            es: "Quinoa, espinaca baby, nuez, arándano seco y queso de cabra."
          },
          price: 950,
          image: "https://images.unsplash.com/photo-1512852939750-1305098529bf?w=600&q=80"
        },
        {
          id: "ensalada-cesar-quinoa",
          name: { en: "Caesar with Crispy Quinoa", es: "César con Quinoa Crocante" },
          description: {
            en: "Romaine lettuce, chicken, parmesan and puffed quinoa croutons.",
            es: "Lechuga romana, pollo, parmesano y crotones de quinoa inflada."
          },
          price: 1050,
          image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=80"
        }
      ]
    },
    {
      id: "bebidas",
      name: { en: "Drinks", es: "Bebidas" },
      items: [
        {
          id: "agua-fruta",
          name: { en: "Fresh Fruit Water", es: "Agua de Fruta Natural" },
          description: {
            en: "Flavour of the day (hibiscus, horchata or lemon).",
            es: "Sabor del día (jamaica, horchata o limón)."
          },
          price: 350,
          image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=80"
        },
        {
          id: "limonada-menta",
          name: { en: "Mint Lemonade", es: "Limonada con Menta" },
          description: {
            en: "Fresh lemon, mint and a touch of ginger.",
            es: "Limón fresco, menta y un toque de jengibre."
          },
          price: 400,
          image: "https://images.unsplash.com/photo-1523371683702-e08c4ba09f0a?w=600&q=80"
        },
        {
          id: "agua-botella",
          name: { en: "Bottled Water", es: "Agua Embotellada" },
          description: { en: "500 ml.", es: "500 ml." },
          price: 200,
          image: "https://images.unsplash.com/photo-1560023907-5f339617ea30?w=600&q=80"
        }
      ]
    },
    {
      id: "postres",
      name: { en: "Desserts", es: "Postres" },
      items: [
        {
          id: "brownie-quinoa",
          name: { en: "Puffed Quinoa Brownie", es: "Brownie de Quinoa Inflada" },
          description: {
            en: "70% dark chocolate, gluten free.",
            es: "Chocolate 70%, sin gluten."
          },
          price: 550,
          image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80"
        },
        {
          id: "pudin-chia",
          name: { en: "Chia & Berry Pudding", es: "Pudín de Chía y Frutos Rojos" },
          description: {
            en: "Almond milk, chia seeds and homemade berry jam.",
            es: "Leche de almendra, chía y mermelada casera de frutos rojos."
          },
          price: 600,
          image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80"
        }
      ]
    }
  ],

  // Textos del menú que no son platillos / Menu texts that aren't dishes.
  labels: {
    deliveryFee: { en: "Delivery fee", es: "Costo de entrega" }
  }
};
