import React from 'react';
import { Leaf } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="border-t border-border/40 bg-background/80 py-6 mt-auto">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Leaf className="w-4 h-4 text-primary" />
                        <span>ZenCycle - Wellness in Motion</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()}{' '}
                        <a 
                            href="https://www.sajithkumarswaminathan.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline transition-colors"
                            data-testid="copyright-link"
                        >
                            www.sajithkumarswaminathan.com
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
