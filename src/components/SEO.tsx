import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    canonical?: string;
    type?: string;
    name?: string;
    twitterHandle?: string;
    ogImage?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    structuredData?: any;
}

export const SEO = ({
    title,
    description,
    canonical,
    type = 'website',
    name = 'Eduspace Academy',
    twitterHandle = '@eduspace',
    ogImage = '/og-image.png',
    structuredData,
    children,
    keywords,
    noIndex = false
}: SEOProps & { children?: React.ReactNode, keywords?: string[], noIndex?: boolean }) => {
    const siteTitle = title ? `${title} | ${name}` : name;
    const siteDescription = description || "Eduspace Academy - A modern learning management system for students and lecturers";
    const siteUrl = window.location.origin;

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{siteTitle}</title>
            <meta name="description" content={siteDescription} />
            {keywords && keywords.length > 0 && (
                <meta name="keywords" content={keywords.join(", ")} />
            )}
            {canonical && <link rel="canonical" href={canonical} />}
            {noIndex && <meta name="robots" content="noindex, nofollow" />}

            {/* Facebook tags */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={siteDescription} />
            <meta property="og:url" content={siteUrl} />
            <meta property="og:image" content={`${siteUrl}${ogImage}`} />

            {/* Twitter tags */}
            <meta name="twitter:creator" content={twitterHandle} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={siteDescription} />
            <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />

            {/* JSON-LD Structured Data */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}

            {children}
        </Helmet>
    );
};

export default SEO;
