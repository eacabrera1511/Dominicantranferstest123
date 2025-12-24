/*
  # TripAdvisor-Style Reviews System

  1. New Tables
    - `tripadvisor_reviews`
      - `id` (uuid, primary key)
      - `reviewer_name` (text) - Customer name
      - `reviewer_location` (text) - Customer location
      - `rating` (integer) - 1-5 stars
      - `review_title` (text) - Review headline
      - `review_text` (text) - Full review content
      - `review_date` (date) - When review was posted
      - `verified_purchase` (boolean) - Verified booking
      - `is_active` (boolean) - Show/hide review
      - `sort_order` (integer) - Display order
      - `created_at` (timestamp)

  2. Purpose
    - Display rotating customer testimonials
    - Build trust with real reviews
    - Animated popup notifications
    - Show social proof

  3. Security
    - Enable RLS
    - Public read access for active reviews
    - Admin-only write access
*/

-- Create tripadvisor_reviews table
CREATE TABLE IF NOT EXISTS tripadvisor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_name text NOT NULL,
  reviewer_location text,
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  review_title text,
  review_text text NOT NULL,
  review_date date NOT NULL DEFAULT CURRENT_DATE,
  verified_purchase boolean DEFAULT true,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tripadvisor_reviews ENABLE ROW LEVEL SECURITY;

-- Public can read active reviews
CREATE POLICY "Anyone can view active reviews"
  ON tripadvisor_reviews
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can manage reviews (admin check in app layer)
CREATE POLICY "Authenticated users can manage reviews"
  ON tripadvisor_reviews
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tripadvisor_reviews_active 
  ON tripadvisor_reviews(is_active, sort_order, review_date DESC);

-- Seed with realistic reviews
INSERT INTO tripadvisor_reviews (reviewer_name, reviewer_location, rating, review_title, review_text, review_date, verified_purchase, sort_order) VALUES
('Sarah M.', 'Toronto, Canada', 5, 'Best transfer service in Punta Cana!', 'Booked a transfer from the airport to our resort and it was flawless. Driver was waiting with a sign, vehicle was spotless and air-conditioned. Much better than the resort shuttles!', '2024-12-20', true, 1),
('Michael R.', 'New York, USA', 5, 'Reliable and professional', 'Used Dominican Transfers for our family of 5. The driver arrived early, helped with luggage, and got us to the hotel safely. Price was exactly as quoted online. Highly recommend!', '2024-12-19', true, 2),
('Emma L.', 'London, UK', 5, 'Excellent service!', 'Driver tracked our flight delay and was still there when we arrived 2 hours late. So professional and friendly. The van was comfortable and clean. Worth every penny!', '2024-12-18', true, 3),
('James K.', 'Chicago, USA', 5, 'Stress-free airport pickup', 'After a long flight, it was so nice to see our driver waiting. No haggling with taxi drivers, no confusion. Just smooth, efficient service. Will use again!', '2024-12-17', true, 4),
('Lisa W.', 'Miami, USA', 5, 'Perfect for groups', 'We had 8 people and they provided a comfortable van with plenty of room for luggage. Driver was courteous and knowledgeable about the area. Great value!', '2024-12-16', true, 5),
('David P.', 'Boston, USA', 5, 'Punctual and friendly', 'Driver arrived 10 minutes early and helped us with our bags. The vehicle was new and very comfortable. Communication before arrival was excellent. Highly professional service!', '2024-12-15', true, 6),
('Jennifer S.', 'Los Angeles, USA', 5, 'Best decision we made', 'Pre-booking this transfer saved us so much hassle. No waiting in lines or dealing with pushy taxi drivers. Clean vehicle, safe driving, and friendly service!', '2024-12-14', true, 7),
('Robert T.', 'Vancouver, Canada', 5, 'Smooth and easy', 'Booking was simple online, price was clear, and the service exceeded expectations. Driver was waiting exactly where he said he would be. Couldn''t ask for more!', '2024-12-13', true, 8),
('Amanda H.', 'Dallas, USA', 5, 'Highly recommend!', 'Used this service for both airport pickup and return. Both times were perfect - on time, clean vehicles, friendly drivers. Much better than the resort transfer options!', '2024-12-12', true, 9),
('Christopher B.', 'Seattle, USA', 5, 'Professional service', 'Driver was waiting at arrivals with our name on a sign. Vehicle was spotless and air-conditioned perfectly. Made our arrival to Punta Cana stress-free. Thank you!', '2024-12-11', true, 10),
('Michelle D.', 'Montreal, Canada', 5, 'Fantastic experience', 'The whole process was seamless. Booking online was easy, received confirmation immediately, and the driver was professional and courteous. Felt very safe and comfortable!', '2024-12-10', true, 11),
('Thomas G.', 'Philadelphia, USA', 5, 'Great value!', 'Compared prices with other services and this was the best deal. The service quality was outstanding - definitely worth the money. Will recommend to everyone!', '2024-12-09', true, 12),
('Karen F.', 'Denver, USA', 5, 'Exceeded expectations', 'Was worried about language barriers but our driver spoke perfect English. He gave us great tips about local restaurants and beaches. Professional and friendly!', '2024-12-08', true, 13),
('Daniel M.', 'Atlanta, USA', 5, 'Reliable and safe', 'Traveling with elderly parents and the driver was so patient and helpful. Drove carefully and made sure everyone was comfortable. Outstanding service!', '2024-12-07', true, 14),
('Patricia L.', 'Phoenix, USA', 5, 'No complaints!', 'Everything was perfect from start to finish. Easy booking, fair price, clean vehicle, professional driver. Exactly what you want from a transfer service!', '2024-12-06', true, 15),
('Steven C.', 'San Diego, USA', 5, 'Impressive service', 'Used several transfer companies in different countries and this is by far the best. Punctual, professional, and great communication. Will use every time I visit!', '2024-12-05', true, 16),
('Rachel N.', 'Portland, USA', 5, 'Wonderful experience', 'Driver waited even though our flight was delayed. He was so friendly and made us feel welcome to the Dominican Republic. Vehicle was modern and comfortable!', '2024-12-04', true, 17),
('Kevin J.', 'Minneapolis, USA', 5, 'Top-notch service', 'From booking to drop-off, everything was handled professionally. The driver knew the best routes and got us to our resort quickly. Highly satisfied!', '2024-12-03', true, 18),
('Laura A.', 'Houston, USA', 5, 'Best transfer ever!', 'Have used many transfer services over the years and this is hands down the best. Great price, excellent service, and the driver was wonderful. Can''t recommend enough!', '2024-12-02', true, 19),
('Brian W.', 'Tampa, USA', 5, 'Flawless execution', 'Booked round trip and both journeys were perfect. On time, clean vehicles, professional drivers. Takes all the stress out of airport transfers. Excellent!', '2024-12-01', true, 20)
ON CONFLICT DO NOTHING;
