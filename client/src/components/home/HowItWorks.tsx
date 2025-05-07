const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: "Choose Your Plan",
      description:
        "Select a meal plan that fits your lifestyle, dietary needs, and preferences.",
      color: "bg-primary",
    },
    {
      number: 2,
      title: "Customize Your Meals",
      description:
        "Pick your favorite dishes from our rotating menu of 30 millet-based options.",
      color: "bg-secondary",
    },
    {
      number: 3,
      title: "Enjoy Fresh Delivery",
      description:
        "We prepare and deliver your meals fresh to your doorstep on your schedule.",
      color: "bg-accent",
    },
  ];

  return (
    <section className="bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How Our Service Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We make healthy eating simple and delicious with our easy-to-use
            subscription service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col items-center text-center p-6 bg-neutral-light rounded-lg card-shadow"
            >
              <div
                className={`w-16 h-16 ${step.color} text-white rounded-full flex items-center justify-center mb-4`}
              >
                <span className="text-2xl font-bold">{step.number}</span>
              </div>
              <h3 className="text-xl font-accent font-semibold mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
