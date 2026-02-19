export function StatsSection() {
    return (
        <section className="py-24 lg:py-40 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                <div className="text-center mb-16">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                        Trusted by Thousands
                    </h2>
                    <p className="text-xl text-blue-100">
                        Join a growing community of learners and educators
                    </p>
                </div>
                <div className="grid md:grid-cols-4 gap-8">
                    <div className="text-center">
                        <div className="text-5xl lg:text-6xl font-black mb-2">10K+</div>
                        <div className="text-blue-100">Active Users</div>
                    </div>
                    <div className="text-center">
                        <div className="text-5xl lg:text-6xl font-black mb-2">500+</div>
                        <div className="text-blue-100">Courses Created</div>
                    </div>
                    <div className="text-center">
                        <div className="text-5xl lg:text-6xl font-black mb-2">50K+</div>
                        <div className="text-blue-100">Assignments Completed</div>
                    </div>
                    <div className="text-center">
                        <div className="text-5xl lg:text-6xl font-black mb-2">98%</div>
                        <div className="text-blue-100">Satisfaction Rate</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
