import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    canonical?: string;
    type?: string;
    name?: string;
    twitterHandle?: string;
    ogImage?: string;
}

export const SEO = ({
    title,
    description,
    canonical,
    type = 'website',
    name = 'EduSpace',
    twitterHandle = '@eduspace',
    ogImage = '/og-image.png'
}: SEOProps) => {
    const siteTitle = title ? `${title} | ${name}` : name;
    const siteDescription = description || "EduSpace - A modern learning management system for students and lecturers";
    const siteUrl = window.location.origin;

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{siteTitle}</title>
            <meta name="description" content={siteDescription} />
            {canonical && <link rel="canonical" href={canonical} />}

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
        </Helmet>
    );
};

export default SEO;
