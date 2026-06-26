'use client';
import React, { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

// These "interfaces" only work in .tsx files
interface GoogleReview {
  author_name: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
}

export default function ReviewCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })]);
  const [reviews, setReviews] = useState<GoogleReview[]>([]);

  useEffect(() => {
    fetch('/api/google-reviews')
      .then((res) => res.json())
      .then((data) => {
        // Handle both standard Google response and direct arrays
        const reviewData = data.reviews || data;
        setReviews(Array.isArray(reviewData) ? reviewData : []);
      })
      .catch((err) => console.error("Durable Fastener API Error:", err));
  }, []);

  if (reviews.length === 0) return null;

  return (
    <div className="bg-[#A68B1F] py-20 px-4 text-white relative z-30">
      <div className="max-w-5xl mx-auto overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {reviews.map((rev, i) => (
            <div key={i} className="flex-[0_0_100%] md:flex-[0_0_50%] px-4">
              <div className="bg-white/10 p-8 rounded-3xl min-h-[320px] border border-white/10 backdrop-blur-md flex flex-col justify-between hover:bg-white/15 transition-colors">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <img 
                      src={rev.profile_photo_url} 
                      className="w-12 h-12 rounded-full border-2 border-white/20 shadow-lg" 
                      alt={rev.author_name} 
                    />
                    <div>
                      <p className="font-bold text-lg leading-tight">{rev.author_name}</p>
                      <div className="text-yellow-400 text-xs mt-1">
                        {"★".repeat(rev.rating)}
                        <span className="text-white/60 ml-2 font-normal italic">
                          {rev.relative_time_description}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-white/90 leading-relaxed italic text-sm md:text-base">
                    "{rev.text.length > 220 ? rev.text.substring(0, 220) + "..." : rev.text}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="mt-12 text-center border-t border-white/20 pt-10">
        <h3 className="text-xl font-bold tracking-[0.2em] uppercase mb-4">Customer Reviews on Google</h3>
        <div className="flex justify-center items-center gap-3 bg-white/5 w-fit mx-auto px-6 py-2 rounded-full border border-white/10">
            <img src="https://www.gstatic.com/images/branding/product/1x/maps_64dp.png" className="w-5 h-5" alt="Google Maps" />
            <span className="text-xs font-black tracking-widest uppercase">Verified Manufacturer Rating</span>
        </div>
      </div>
    </div>
  );
}