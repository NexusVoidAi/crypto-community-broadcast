
import type { Config } from "tailwindcss";
import { theme } from "./src/theme";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// NexusVoid theme integration with Tailwind
				'nexus': {
					'background': theme.colors.background.primary,
					'background-secondary': theme.colors.background.secondary,
					'background-tertiary': theme.colors.background.tertiary,
					'card': theme.colors.background.card,
					'text': theme.colors.text.primary,
					'text-secondary': theme.colors.text.secondary,
					'text-muted': theme.colors.text.muted,
					'border': theme.colors.border.primary,
					'border-subtle': theme.colors.border.subtle,
					'border-accent': theme.colors.border.accent,
				},
				// Custom crypto theme colors
				crypto: {
					'blue': theme.colors.brand.blue,
					'violet': theme.colors.brand.violet,
					'green': theme.colors.brand.green,
					'teal': theme.colors.brand.teal,
					'dark': theme.colors.background.primary,
					'darkgray': theme.colors.background.secondary
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-glow': {
					'0%, 100%': { 
						boxShadow: '0 0 5px rgba(20, 241, 149, 0.3), 0 0 10px rgba(20, 241, 149, 0.2)' 
					},
					'50%': { 
						boxShadow: '0 0 15px rgba(20, 241, 149, 0.6), 0 0 20px rgba(20, 241, 149, 0.4)' 
					},
				},
				'fade-in': {
					'0%': { 
						opacity: '0',
						transform: 'translateY(-10px)'
					},
					'100%': { 
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scale-in': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 2s infinite',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
			},
			fontFamily: {
				'space': [theme.typography.fontFamily.primary],
				'inter': [theme.typography.fontFamily.secondary]
			},
			backgroundImage: {
				'main-gradient': theme.gradients.mainBackground,
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'grid-pattern': 'url("data:image/svg+xml,%3Csvg width=\'30\' height=\'30\' viewBox=\'0 0 30 30\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1.22676 0C1.91374 0 2.45351 0.539773 2.45351 1.22676C2.45351 1.91374 1.91374 2.45351 1.22676 2.45351C0.539773 2.45351 0 1.91374 0 1.22676C0 0.539773 0.539773 0 1.22676 0Z\' fill=\'rgba(255,255,255,0.07)\'/%3E%3C/svg%3E")',
				'gradient-1': theme.gradients.gradient1,
				'gradient-2': theme.gradients.gradient2,
				'gradient-3': theme.gradients.gradient3,
				'card-gradient': theme.gradients.cardGradient,
				'button-gradient': theme.gradients.buttonGradient,
				'accent-gradient': theme.gradients.accentGradient,
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
