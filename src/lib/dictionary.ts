export type Language = 'es' | 'en';

export const dictionary = {
    es: {
        // Header & Footer
        faq: "Preguntas Frecuentes",
        made_in: "Hecho en Argentina",

        // Hero
        hero_title: "Mixes de ⚡\nFrutos Secos a tu manera",
        hero_subtitle: "Armá tu Mix de 220g con ingredientes seleccionados\nLlevate 5, o más, para recargar las pilas 🔋⚡",
        delivery_free: "Delivery gratuito en",
        location: "Ciudad Universitaria",

        // MixBuilder
        ingredients: {
            banana: "Banana chips",
            durazno: "Durazno",
            almendras: "Almendras",
            nueces: "Nueces",
            uva: "Uva deshidratada",
        },
        builder_title: "Armá tu Mix (220g)",
        min_per_ingredient: "Mínimo por ingrediente",
        max_per_ingredient: "Máximo por ingrediente",
        card_ingredients_title: "Ingredientes",
        classic_mix_btn: "Mix Clásico (≡)",
        classic_mix_tooltip: "Poner todos los ingredientes en 44g",
        classic_mix_already: "Ya es Mix Clásico",
        add_to_cart: "Agregar al carrito",
        complete_remaining: "Completá los {g}g restantes para agregar al carrito",
        min_mixes_required: "Se requiere un mínimo de 5 Mixes para realizar el pedido (actualmente: {qty})",

        // Distribution Chart
        distribution_title: "Distribución del Mix",

        // Cart
        cart_title: "Carrito de Compra",
        cart_empty: "No hay Mixes en el carrito 🛒",
        cart_build_link: "Agregalos arriba ↑",
        mix_composed_of: "Mix compuesto por",
        edit: "Editar",
        duplicate: "Duplicar",
        remove: "Eliminar",
        mix_percent_of: "de",
        back_to_top: "Volver arriba para agregar más Mixes con otros ingredientes ↑",
        label_quantity: "Cantidad de Mixes",
        label_grams: "Gramos totales",
        label_delivery: "Delivery",
        delivery_compact_pickup: "Ciudad Universitaria ($0)",
        delivery_compact_shipping: "Córdoba Capital (${price})",
        delivery_label_pickup: "Facultad o lugar de entrega",
        delivery_label_shipping: "Dirección de entrega",
        delivery_placeholder_pickup: "Ej: Pabellón Argentina",
        delivery_placeholder_shipping: "Ej: Av. Valparaíso 1234, Córdoba",
        label_phone_contact: "Celular (para coordinar la entrega)",
        placeholder_phone_contact: "Ej: 351 153 123456",

        // Checkout & Payment
        subtotal_no_promo: "Subtotal (sin promo)",
        savings_free_shipping: "Ahorro por envío gratuito",
        savings_discount_percentage: "Ahorro por descuento del {value}%",
        savings_discount_code: "Ahorro por código de descuento",
        savings_promos: "Ahorro por las promos",
        pay_cash: "Abonar en efectivo",
        pay_mercadopago: "Abonar con Mercado Pago",

        // Success Modal
        order_confirmed: "¡Pedido confirmado!",
        order_confirmed_body: "Te contactaremos por WhatsApp para coordinar la entrega y el pago en efectivo.\nRevisá tu email para más detalles.",
        whatsapp_button: "Coordinar ahora por WhatsApp",
        open_gmail: "Abrir casilla de Gmail",

        // Checkout form
        delivery_method_title: "Tipo de entrega",
        delivery_pickup: "Punto de encuentro",
        delivery_pickup_detail: "(Gratis) - Pabellón Argentina (UNC)",
        delivery_shipping: "Envío a domicilio",
        delivery_shipping_detail: "($1000) - Solo zona Nueva Córdoba / Centro / Güemes",

        contact_info_title: "Datos de contacto",
        label_name: "Nombre",
        placeholder_name: "Tu nombre",
        label_phone: "Teléfono",
        placeholder_phone: "Tu teléfono (WhatsApp)",
        label_address: "Dirección de envío",
        placeholder_address: "Calle y número, Piso/Depto",
        label_email: "Email",
        placeholder_email: "tu@email.com",

        discount_title: "Código de descuento (opcional)",
        discount_placeholder: "Tu código",
        discount_apply: "Aplicar",
        discount_question: "¿Tenés un código de descuento? Hacé click aquí",
        discount_invalid: "Por favor ingrese un código de descuento válido",

        summary_title: "Resumen",
        total_mixes: "Total de Mixes",
        subtotal: "Subtotal",
        delivery_cost: "Costo de envío",
        discount_applied: "Descuento aplicado",
        total_to_pay: "Total a pagar",
        original_price: "Precio lista",
        discounts: "Descuentos",

        send_whatsapp: "Enviar pedido por WhatsApp",

        // Promo logic text (generated)
        promo_mixes: "Mixes",
        promo_of: "de",
        promo_promo: "promo",

        // Pricing
        pricing_title: "Precios y Promos",
        pricing_subtitle: "Elegí la mejor opción para vos",
        pricing_min_notice: "El pedido mínimo es de 5 unidades ➡",
        pricing_tier_1_title: "10 Mixes (2200g)",
        pricing_tier_1_price: "$35000 pesos",
        pricing_tier_1_desc: "Energía para compartir",
        pricing_tier_2_title: "5 Mixes (1100g)",
        pricing_tier_2_price: "$18000 pesos",
        pricing_tier_2_desc: "Energía para varias semanas",
        pricing_tier_3_title: "15 Mixes (3300g)",
        pricing_tier_3_price: "$53000 pesos",
        pricing_tier_3_desc: "Energía para eventos especiales",
        pricing_buy_btn: "Comprar",
        pricing_includes: "FRUTOS SELECCIONADOS:",
        pricing_ingredients_list: "Pasas de uva, Almendras, Nueces, Banana chips, Durazno",

        // FAQ
        faq_title_full: "Preguntas Frecuentes",
        faq_subtitle: "¡Preguntanos lo que quieras!",
        faq_contact_email: "gonza@moovimiento.com",
        faq_q1: "¿Es seguro comprar en Moovimiento?",
        faq_a1: "Totalmente. Usamos Mercado Pago para procesar los cobros, así que tu dinero y tus datos están siempre protegidos. ¡Podés comprar tranquila/o!",
        faq_q2: "¿Puedo disfrutar de los frutos secos de Moovimiento en cualquier momento?",
        faq_a2: "¡Sí! Trabajamos con stock fresco y hacemos envíos rápidos en Ciudad Universitaria y Nueva Córdoba para que te lleguen impecables.",
        faq_q3: "¿Por qué elegir frutos secos como snack?",
        faq_a3: "Porque son prácticos, saludables y naturales. Te aportan energía, proteínas y grasas buenas que te ayudan a rendir mejor en el estudio, trabajo o entrenamiento.",
        faq_q4: "¿Puedo personalizar la composición?",
        faq_a4: "¡Sí, claro! Por defecto vienen equilibrados, pero en el armador de Mixes (más arriba en esta página) podés elegir la proporción de cada ingrediente (máximo 66g por ingrediente). ¡Vos decidís!",

        // Trust / Footer Slogan
        trust_slogan: "Energía que te acompaña en cada paso",
        trust_sub: "Snacks ricos y prácticos para rendir en la facu, el trabajo, ¡o donde pinten las pilas!",
    },
    en: {
        // Header & Footer
        faq: "FAQs",
        made_in: "Made in Argentina",

        // Hero
        hero_title: "Build your ⚡\nTrail Mix your way",
        hero_subtitle: "Build your 220g Mix with selected ingredients\nGet 5, or more, to recharge your energy 🔋⚡",
        delivery_free: "Free delivery at",
        location: "Ciudad Universitaria",

        // MixBuilder
        ingredients: {
            banana: "Banana chips",
            durazno: "Peach",
            almendras: "Almonds",
            nueces: "Walnuts",
            uva: "Raisins",
        },
        builder_title: "Build your Mix (220g)",
        min_per_ingredient: "Min per ingredient",
        max_per_ingredient: "Max per ingredient",
        card_ingredients_title: "Ingredients",
        classic_mix_btn: "Classic Mix (≡)",
        classic_mix_tooltip: "Set all ingredients to 44g",
        classic_mix_already: "It's already a Classic Mix",
        add_to_cart: "Add to cart",
        complete_remaining: "Complete the remaining {g}g to add to cart",
        min_mixes_required: "A minimum of 5 Mixes is required to place an order (currently: {qty})",

        // Distribution Chart
        distribution_title: "Mix distribution",

        // Cart
        cart_title: "Shopping Cart",
        cart_empty: "No Mixes in the cart 🛒",
        cart_build_link: "Add above ↑",
        mix_composed_of: "Mix composed of",
        edit: "Edit",
        duplicate: "Duplicate",
        remove: "Remove",
        mix_percent_of: "of",
        back_to_top: "Back to top to add Mixes with other ingredients ↑",
        label_quantity: "Number of Mixes",
        label_grams: "Total grams",
        label_delivery: "Delivery",
        delivery_compact_pickup: "Ciudad Universitaria ($0)",
        delivery_compact_shipping: "Cordoba Capital (${price})",
        delivery_label_pickup: "Meeting point",
        delivery_label_shipping: "Shipping address",
        delivery_placeholder_pickup: "Ex: Pabellón Argentina",
        delivery_placeholder_shipping: "Ex: Av. Valparaíso 1234, Cordoba",
        label_phone_contact: "Phone (to coordinate delivery)",
        placeholder_phone_contact: "Ex: 351 153 123456",

        // Checkout & Payment
        subtotal_no_promo: "Subtotal (no promo)",
        savings_free_shipping: "Free shipping savings",
        savings_discount_percentage: "Discount savings of {value}%",
        savings_discount_code: "Discount code savings",
        savings_promos: "Promo savings",
        pay_cash: "Pay in cash",
        pay_mercadopago: "Pay with Mercado Pago",

        // Success Modal
        order_confirmed: "Order confirmed!",
        order_confirmed_body: "We will contact you via WhatsApp to coordinate delivery and cash payment.\nCheck your email for details.",
        whatsapp_button: "Coordinate now via WhatsApp",
        open_gmail: "Open Gmail",

        // Checkout form
        delivery_method_title: "Delivery method",
        delivery_pickup: "Meeting point",
        delivery_pickup_detail: "(Free) - Pabellon Argentina (UNC)",
        delivery_shipping: "Home delivery",
        delivery_shipping_detail: "($1000) - Only Nueva Cordoba / Centro / Güemes",

        contact_info_title: "Contact info",
        label_name: "Name",
        placeholder_name: "Your name",
        label_phone: "Phone",
        placeholder_phone: "Your phone (WhatsApp)",
        label_address: "Shipping address",
        placeholder_address: "Street and number, Apt/Floor",
        label_email: "Email",
        placeholder_email: "you@email.com",

        discount_title: "Discount code (optional)",
        discount_placeholder: "Your code",
        discount_apply: "Apply",
        discount_question: "Do you have a discount code? Click here",
        discount_invalid: "Please enter a valid discount code",

        summary_title: "Summary",
        total_mixes: "Total Mixes",
        subtotal: "Subtotal",
        delivery_cost: "Delivery cost",
        discount_applied: "Discount applied",
        total_to_pay: "Total to pay",
        original_price: "List price",
        discounts: "Discounts",

        send_whatsapp: "Send order via WhatsApp",

        // Promo logic text
        promo_mixes: "Mixes",
        promo_of: "of",
        promo_promo: "promo",

        // Pricing
        pricing_title: "Prices and Promos",
        pricing_subtitle: "Choose the best option for you",
        pricing_min_notice: "Minimum order is 5 Mixes ➡",
        pricing_tier_1_title: "10 Mixes (2200g)",
        pricing_tier_1_price: "$35000 ARS",
        pricing_tier_1_desc: "Energy to share",
        pricing_tier_2_title: "5 Mixes (1100g)",
        pricing_tier_2_price: "$18000 ARS",
        pricing_tier_2_desc: "Energy for a bunch of weeks",
        pricing_tier_3_title: "15 Mixes (3300g)",
        pricing_tier_3_price: "$53000 ARS",
        pricing_tier_3_desc: "Energy for special events",
        pricing_buy_btn: "Buy",
        pricing_includes: "SELECTED NUTS:",
        pricing_ingredients_list: "Raisins, Almonds, Walnuts, Banana chips, Peach",

        // FAQ
        faq_title_full: "Frequently Asked Questions",
        faq_subtitle: "Ask me anything!",
        faq_contact_email: "gonza@moovimiento.com",
        faq_q1: "Is it safe to buy at Moovimiento?",
        faq_a1: "Absolutely. We use Mercado Pago to process payments, ensuring your transaction is secure and your data is protected.",
        faq_q2: "Can I enjoy Moovimiento nuts at any time?",
        faq_a2: "Yes! We work with fresh stock and provide fast delivery in Ciudad Universitaria and Nueva Cordoba, so they arrive in perfect condition.",
        faq_q3: "Why choose nuts as a snack?",
        faq_a3: "Because they are practical, healthy, and natural. They provide energy, protein, and good fats to help you perform better in study, work, or training.",
        faq_q4: "Can I customize the composition?",
        faq_a4: "Of course! By default, Mixes are balanced, but you can customize them in the 'Build your Mix' section above. You can adjust the amount of each ingredient (up to 66g). You're in control!",

        // Trust / Footer Slogan
        trust_slogan: "Energy that accompanies you at every step",
        trust_sub: "Tasty and practical snacks to perform at university, work, or wherever you want!",
    }
};
