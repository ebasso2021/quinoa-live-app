// Menú de ejemplo para "Quinoa". Edita libremente este archivo:
// agrega, quita o cambia platillos, precios (en centavos), categorías o fotos.
// Los precios están en centavos (Stripe trabaja así). Ej: 1250 = $12.50
// La moneda es el dólar canadiense ("cad"). Si algún día cambias de país,
// aquí puedes poner "usd", "mxn", "eur", etc.

module.exports = {
  currency: "cad",
  categories: [
    {
      id: "bowls",
      name: "Bowls de Quinoa",
      items: [
        {
          id: "bowl-clasico",
          name: "Bowl Clásico Quinoa",
          description: "Quinoa, aguacate, tomate cherry, pepino, garbanzos y aderezo de limón.",
          price: 1050,
          image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80"
        },
        {
          id: "bowl-pollo",
          name: "Bowl de Pollo a la Parrilla",
          description: "Quinoa, pollo grillado, elote, pico de gallo y aderezo chipotle.",
          price: 1250,
          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80"
        },
        {
          id: "bowl-vegano",
          name: "Bowl Vegano Andino",
          description: "Quinoa tricolor, camote asado, kale, frijol negro y aderezo tahini.",
          price: 1150,
          image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80"
        },
        {
          id: "bowl-salmon",
          name: "Bowl de Salmón",
          description: "Quinoa, salmón sellado, edamame, zanahoria y aderezo de sésamo-jengibre.",
          price: 1450,
          image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80"
        }
      ]
    },
    {
      id: "ensaladas",
      name: "Ensaladas",
      items: [
        {
          id: "ensalada-quinoa-frutos",
          name: "Ensalada de Quinoa y Frutos Secos",
          description: "Quinoa, espinaca baby, nuez, arándano seco y queso de cabra.",
          price: 950,
          image: "https://images.unsplash.com/photo-1512852939750-1305098529bf?w=600&q=80"
        },
        {
          id: "ensalada-cesar-quinoa",
          name: "César con Quinoa Crocante",
          description: "Lechuga romana, pollo, parmesano, crotones de quinoa inflada.",
          price: 1050,
          image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=80"
        }
      ]
    },
    {
      id: "bebidas",
      name: "Bebidas",
      items: [
        {
          id: "agua-fruta",
          name: "Agua de Fruta Natural",
          description: "Sabor del día (jamaica, horchata o limón).",
          price: 350,
          image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=80"
        },
        {
          id: "limonada-menta",
          name: "Limonada con Menta",
          description: "Limón fresco, menta y un toque de jengibre.",
          price: 400,
          image: "https://images.unsplash.com/photo-1523371683702-e08c4ba09f0a?w=600&q=80"
        },
        {
          id: "agua-botella",
          name: "Agua Embotellada",
          description: "500 ml.",
          price: 200,
          image: "https://images.unsplash.com/photo-1560023907-5f339617ea30?w=600&q=80"
        }
      ]
    },
    {
      id: "postres",
      name: "Postres",
      items: [
        {
          id: "brownie-quinoa",
          name: "Brownie de Quinoa Inflada",
          description: "Chocolate 70%, sin gluten.",
          price: 550,
          image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80"
        },
        {
          id: "pudin-chia",
          name: "Pudín de Chía y Frutos Rojos",
          description: "Leche de almendra, chía, mermelada casera de frutos rojos.",
          price: 600,
          image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80"
        }
      ]
    }
  ]
};
