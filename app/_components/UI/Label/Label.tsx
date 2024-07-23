import type { HTMLProps, FC, ReactNode } from 'react';
import styles from './Label.module.css';

interface LabelProps {
    size?: 'sm' | 'm' | 'lg';
    className?: string;
    htmlFor?: string;
    children: ReactNode;
}

const fontSize = { 'sm': 14, 'm': 16, 'lg': 18 };

const Label: FC<LabelProps> = ({ className, size = 'sm', children, htmlFor }) => {
    return <label style={{ fontSize: `${fontSize[size]}px`, letterSpacing: `-0.${fontSize[size]}px` }} htmlFor={htmlFor} className={`${styles['label']} ${className ? className : ''}`}>{children}</label>
}

export default Label;