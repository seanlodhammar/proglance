import styles from './PreForm.module.css';
import type { ReactNode } from 'react';
import { RectStack } from '../icons';

const PreForm = ({ title, type, children }: { title: string; type?: 'auth' | 'generic'; children: ReactNode }) => {
    return (
        <div className={styles['wrapper']}>
            <RectStack className={styles['icon']} />
            <h2 className={`${styles['heading']} ${type === 'auth' ? styles['auth'] : ''}`}>{ title }</h2>
            { children }
        </div>
    )
}

export default PreForm;