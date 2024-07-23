import styles from './PreForm.module.css';
import type { ReactNode } from 'react';
import { RectStack } from '../icons';

const PreForm = ({ title, children }: { title: string; children: ReactNode }) => {
    return (
        <div className={styles['wrapper']}>
            <RectStack className={styles['icon']} />
            <h2 className={styles['heading']}>{ title }</h2>
            { children }
        </div>
    )
}

export default PreForm;