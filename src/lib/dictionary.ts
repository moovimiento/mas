export type Language = 'es' | 'en';

export const dictionary = {
    es: {
        // Header & Footer
        faq: "Preguntas frecuentes",
        made_in: "Hecho en Argentina",

        // Hero
        hero_title: "Mixs de ⚡\nFrutos Secos a tu manera",
        hero_subtitle: "Armá tu mix de 220g con ingredientes seleccionados",
        delivery_free: "Delivery gratuito en",
        location: "Ciudad Universitaria",

        // MixBuilder
        ingredients: {
            banana: "Banana chips",
            pera: "Pera deshidratada",
            almendras: "Almendras",
            nueces: "Nueces",
            uva: "Uva deshidratada",
        },
        builder_title: "Armá tu mix (220g)",
        min_per_ingredient: "Mínimo por ingrediente",
        max_per_ingredient: "Máximo por ingrediente",
        card_ingredients_title: "Ingredientes",
        classic_mix_btn: "Mix clásico (≡)",
        classic_mix_tooltip: "Poner todos los ingredientes en 44g",
        classic_mix_already: "Ya es mix clásico",
        add_to_cart: "Agregar al carrito",
        complete_remaining: "Completá los {g}g restantes para agregar al carrito",

        // Distribution Chart
        distribution_title: "Distribución del mix",

        // Cart
        cart_title: "Carrito de Compra",
        cart_empty: "No hay mixs en el carrito 🛒",
        cart_build_link: "Armalo arriba y agregalo ↑",
        mix_composed_of: "Mix compuesto por",
        edit: "Editar",
        duplicate: "Duplicar",
        remove: "Eliminar",
        mix_percent_of: "de",
        back_to_top: "Volver arriba para agregar un mix con otros ingredientes ↑",
        label_quantity: "Cantidad",
        label_grams: "Gramos",
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
        label_email: "Email (opcional)",
        placeholder_email: "tu@email.com",

        discount_title: "Código de descuento",
        discount_placeholder: "Ingresa tu código",
        discount_apply: "Aplicar",
        discount_question: "¿Tenés un código de descuento? Hacé click aquí",
        discount_invalid: "Por favor ingrese un código de descuento válido",

        summary_title: "Resumen",
        total_mixes: "Total Mixs",
        subtotal: "Subtotal",
        delivery_cost: "Costo de envío",
        discount_applied: "Descuento aplicado",
        total_to_pay: "Total a pagar",
        original_price: "Precio lista",
        discounts: "Descuentos",

        send_whatsapp: "Enviar pedido por WhatsApp",

        // Promo logic text (generated)
        promo_mixs: "Mixs",
        promo_of: "de",
        promo_promo: "promo",
    },
    en: {
        // Header & Footer
        faq: "FAQ",
        made_in: "Made in Argentina",

        // Hero
        hero_title: "Build your ⚡\nTrail Mix your way",
        hero_subtitle: "Build your 220g mix with selected ingredients",
        delivery_free: "Free delivery at",
        location: "Ciudad Universitaria",

        // MixBuilder
        ingredients: {
            banana: "Banana chips",
            pera: "Dried Pear",
            almendras: "Almonds",
            nueces: "Walnuts",
            uva: "Raisins",
        },
        builder_title: "Build your mix (220g)",
        min_per_ingredient: "Min per ingredient",
        max_per_ingredient: "Max per ingredient",
        card_ingredients_title: "Ingredients",
        classic_mix_btn: "Classic Mix (≡)",
        classic_mix_tooltip: "Set all ingredients to 44g",
        classic_mix_already: "It's already a classic mix",
        add_to_cart: "Add to cart",
        complete_remaining: "Complete the remaining {g}g to add to cart",

        // Distribution Chart
        distribution_title: "Mix distribution",

        // Cart
        cart_title: "Shopping Cart",
        cart_empty: "No mixes in the cart 🛒",
        cart_build_link: "Build it above and add it ↑",
        mix_composed_of: "Mix composed of",
        edit: "Edit",
        duplicate: "Duplicate",
        remove: "Remove",
        mix_percent_of: "of",
        back_to_top: "Back to top to add a mix with other ingredients ↑",
        label_quantity: "Quantity",
        label_grams: "Grams",
        label_delivery: "Delivery",
        delivery_compact_pickup: "Ciudad Universitaria ($0)",
        delivery_compact_shipping: "Córdoba Capital (${price})",
        delivery_label_pickup: "Faculty or meeting point",
        delivery_label_shipping: "Shipping address",
        delivery_placeholder_pickup: "Ex: Pabellón Argentina",
        delivery_placeholder_shipping: "Ex: Av. Valparaíso 1234, Córdoba",
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
        delivery_pickup_detail: "(Free) - Pabellón Argentina (UNC)",
        delivery_shipping: "Home delivery",
        delivery_shipping_detail: "($1000) - Only Nueva Córdoba / Centro / Güemes",

        contact_info_title: "Contact info",
        label_name: "Name",
        placeholder_name: "Your name",
        label_phone: "Phone",
        placeholder_phone: "Your phone (WhatsApp)",
        label_address: "Shipping address",
        placeholder_address: "Street and number, Apt/Floor",
        label_email: "Email (optional)",
        placeholder_email: "you@email.com",

        discount_title: "Discount code",
        discount_placeholder: "Enter your code",
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
        promo_mixs: "Mixes",
        promo_of: "of",
        promo_promo: "promo",
    }
};
