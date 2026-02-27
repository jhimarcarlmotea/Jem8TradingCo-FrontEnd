import { useState } from "react";
import { Link } from "react-router-dom";
import "../style/global.css";
import "../style/pages.css";

const FAQ_ITEMS = [
  {
    q: "What products do you supply?",
    a: `We have several options you can choose from on our order requests form: Office supplies, Pantry supplies, Janitorial supplies, Health and Wellness Products.

We supply all wellness products. Send us either an email or visit our store listing that you are requesting for a product listing you specifically need.

Email: jem8.jinkiedelacruz@gmail.com
Contact Numbers: (02) 8805-1432
jem8circletrading@gmail.com (02) 8785-0587
(02) 8785-0587

We also do Customized items for Giveaways, and we have in house embroidery services.`,
  },
  {
    q: "How much do your products cost?",
    a: `Choose either to see our supplies: Office Supplies and Equipment, Family Supplies, Janitorial Supplies, Health and Wellness Products.

Send us a message that you're requesting for a price list on the contact information listed below. You can also request to have a custom quote sent to your email.`,
  },
  {
    q: "Can I request for a price quotation?",
    a: `Send us your list of requirements. Tell us the products you need as well as some personal information: Company Name, Company address, Contact Person, Mobile number and Email address so we can have it as a reference in creating the price quotation.`,
  },
  {
    q: "What are your Payment Terms?",
    a: `First-time orders are eligible for Cash-On-Delivery (COD) or payment transfer on or before the date of delivery. After this, you are required to complete and submit client information at the store and our Accounting Department will issue you a Statement of Account with its payment terms (available plans for your business, whether 7 days to 60 days) for your benefit while the approved payment terms will be followed.`,
  },
  {
    q: "Free Delivery",
    a: `We offer free delivery when orders hit a certain amount is reached. For Regular/Metro Manila orders, we can still assist you in shipping your deliveries here. We have a partner courier that can deliver your items to COD basis within Metro Manila, Rizal province and Laguna. County and Barangay Payment Delivery is applicable on all orders as well as door-to-door metro Manila service.`,
  },
  {
    q: "Details",
    a: `We are looking to invest to be your supplier and business relationship. Just message us to learn more!

Email:                          Contact Numbers:
jem8.jinkiedelacruz@gmail.com  (02) 8805-1432
jem8.jinkiedelacruz@gmail.com  (02) 8785-0587
jem8circletrading@gmail.com     (02) 8785-0587`,
  },
];

function AccordionItem({ item, isOpen, onToggle }) {
  return (
    <div className={`faq-item${isOpen ? " open" : ""}`}>
      <button className="faq-item__trigger" onClick={onToggle}>
        <span className="faq-item__question">{item.q}</span>
        <span className="faq-item__icon">{isOpen ? "↑" : "↓"}</span>
      </button>
      <div className="faq-item__body">
        <div className="faq-item__answer">
          {item.a.split("\n").map((line, i) =>
            line.trim() === "" ? <br key={i} /> : <p key={i}>{line}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="faq-page">


      {/* ── HERO ── */}
      <section className="faq-hero">
        <div className="container faq-hero__inner">
          <span className="faq-hero__label">Support Center</span>
          <h1 className="faq-hero__title">Frequently Asked Questions</h1>
          <p className="faq-hero__sub">
            Learn more about the company and how our business grew.
          </p>
        </div>
      </section>

      {/* ── FAQ LIST ── */}
      <section className="faq-main">
        <div className="container faq-main__inner">
          <div className="faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem
                key={i}
                item={item}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── STILL HAVE QUERIES ── */}
      <section className="faq-cta">
        <div className="container faq-cta__inner">
          <div className="faq-cta__icon">💬</div>
          <h2 className="faq-cta__title">Still have queries?</h2>
          <p className="faq-cta__sub">Can't find the answer you're looking for? Our team is here to help.</p>
          <Link to="/contact" className="faq-cta__btn">Contact Us</Link>
        </div>
      </section>


    </div>
  );
}