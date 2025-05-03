import { Star } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  plan: string;
  duration: string;
  rating: number;
  image: string;
  text: string;
}

const Testimonials = () => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Rahul Sharma",
      plan: "Premium Plan",
      duration: "6 months",
      rating: 5,
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      text: "As someone with diabetes, finding tasty low-glycemic meals was a challenge until I discovered MealMillet. Their millet-based dishes have helped me manage my blood sugar while enjoying delicious food.",
    },
    {
      id: 2,
      name: "Ananya Patel",
      plan: "Family Plan",
      duration: "3 months",
      rating: 5,
      image: "https://randomuser.me/api/portraits/women/28.jpg",
      text: "My kids were picky eaters until we tried MealMillet's family plan. The variety keeps mealtime exciting, and my children actually love the millet-based dishes! Plus, I feel good knowing they're eating nutritiously.",
    },
    {
      id: 3,
      name: "Vikram Reddy",
      plan: "Basic Plan",
      duration: "2 months",
      rating: 4,
      image: "https://randomuser.me/api/portraits/men/75.jpg",
      text: "The authentic flavors of Hyderabad cuisine combined with the health benefits of millet is a winning combination. The delivery is always on time, and the food quality is consistently excellent.",
    },
  ];

  return (
    <section className="py-16 bg-neutral-light">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hear from our satisfied subscribers who have transformed their eating habits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white p-6 rounded-lg card-shadow">
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-accent font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">
                    {testimonial.plan} · {testimonial.duration}
                  </p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < testimonial.rating ? "fill-current" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-600">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
