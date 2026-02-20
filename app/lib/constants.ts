/**
 * Shared constants for the Devasutra store
 */

export const SITE_NAME = 'Devasutra';
export const SITE_TAGLINE = 'Sacred Ornaments · Divine Energy';

/**
 * Hero slider data.
 * TODO: Replace Unsplash URLs with your actual images placed in /public/hero/
 * e.g. image: '/hero/hero1.jpg'
 */
export const HERO_SLIDES = [
    {
        image: 'https://images.unsplash.com/photo-1609178329405-ea734e2ad84c?w=1400&q=80',
        tagline: 'Every Bead Tells A Story',
        heading: 'Divine Symbolism',
        description:
            'From Rudraksha to Sandalwood, each material carries unique symbolism — protection, devotion, and awakening.',
        cta: 'Shop the Collection',
        link: '/collections/all',
    },
    {
        image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1400&q=80',
        tagline: 'Handcrafted With Devotion',
        heading: 'Sacred Bracelets',
        description:
            'Authentic gemstone bracelets blessed and energized by spiritual experts for your well-being.',
        cta: 'Explore Bracelets',
        link: '/collections/all',
    },
    {
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80',
        tagline: 'Ancient Wisdom, Modern Craft',
        heading: 'Rudraksha Malas',
        description:
            'Lab-certified Rudraksha malas handcrafted by skilled artisans with silver and gold capping.',
        cta: 'Shop Malas',
        link: '/collections/all',
    },
    {
        image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1400&q=80',
        tagline: 'Blessings For Every Home',
        heading: 'Sacred Idols & Pyramids',
        description:
            'Vastu-approved divine idols and crystal pyramids to bring prosperity and positive energy.',
        cta: 'Discover More',
        link: '/collections/all',
    },
];

/** Trust badges for the "Our Promise" section */
export const TRUST_BADGES = [
    {
        icon: '🕉️',
        title: 'Blessed by Experts',
        description:
            'Each product is energized and blessed by spiritual experts before shipping to ensure authenticity and divine energy.',
    },
    {
        icon: '✅',
        title: '100% Authentic',
        description:
            'Sourced from trusted origins worldwide. Every stone and bead is natural, original, and handpicked for quality.',
    },
    {
        icon: '📜',
        title: 'Govt. Lab Certified',
        description:
            'Certified by recognized gemology laboratories. Passed multiple screenings for originality and quality assurance.',
    },
    {
        icon: '🤲',
        title: 'Handcrafted with Devotion',
        description:
            'Meticulously crafted by experienced artisans with special attention to detail and unparalleled craftsmanship.',
    },
];

/** Placeholder testimonials */
export const TESTIMONIALS = [
    {
        name: 'Priya Sharma',
        location: 'Mumbai, India',
        rating: 5,
        text: 'The Rudraksha mala I received is absolutely beautiful and authentic. I could feel the positive energy from the moment I wore it. Highly recommended!',
        avatar: '',
    },
    {
        name: 'Rajesh Kumar',
        location: 'Delhi, India',
        rating: 5,
        text: 'Excellent quality gemstone bracelet. The packaging was premium and the delivery was quick. Will definitely order again from Devasutra.',
        avatar: '',
    },
    {
        name: 'Ananya Patel',
        location: 'Bangalore, India',
        rating: 4,
        text: 'Beautiful Karungali mala with silver capping. The craftsmanship is exceptional. My whole family now orders from Devasutra.',
        avatar: '',
    },
    {
        name: 'Vikram Singh',
        location: 'Jaipur, India',
        rating: 5,
        text: 'I ordered the Dhan Yog bracelet and it arrived with a government lab certificate. Very trustworthy and authentic products.',
        avatar: '',
    },
];

/** Sub-navigation island items  */
export const SUB_NAV_ITEMS = [
    { title: 'Rudraksha', link: '/collections/all' },
    { title: 'Bracelets', link: '/collections/all' },
    { title: 'Sacred Malas', link: '/collections/all' },
];

/** Free shipping threshold in INR */
export const FREE_SHIPPING_THRESHOLD = 999;
