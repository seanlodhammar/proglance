import { Inter, Questrial, Raleway } from 'next/font/google';

export const inter = Inter({
    subsets: ['latin'],
    weight: 'variable',
    variable: '--font-inter',
})

export const raleway = Raleway({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    variable: '--font-raleway',
})

export const questrial = Questrial({
    subsets: ['latin'],
    weight: ['400'],
    variable: '--font-questrial',    
})
