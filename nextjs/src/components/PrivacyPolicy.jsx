import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-container">
      <h1>Privacy Policy</h1>
      
      <div className="policy-content">
        <section className="intro-section">
          <p>
            Your privacy is important to AL-FANAR. This privacy statement provides information 
            about the personal information that AL-FANAR collects and the ways in which AL-FANAR 
            uses that personal information.
          </p>
        </section>

        <section>
          <h2>Personal Information Collection</h2>
          <p>AL-FANAR may collect and use the following kinds of personal information:</p>
          <ul>
            <li>Information about your use of this website</li>
            <li>Information that you provide for the purpose of registering with the website</li>
            <li>Information about transactions carried out over this website</li>
            <li>Information that you provide for the purpose of subscribing to the website services</li>
            <li>Any other information that you send to us</li>
          </ul>
        </section>

        <section>
          <h2>Using Personal Information</h2>
          <p>AL-FANAR may use your personal information to:</p>
          <ul>
            <li>Administer this website</li>
            <li>Personalize the website for you</li>
            <li>Enable your access to and use of the website services</li>
            <li>Publish information about you on the website</li>
            <li>Send to you products that you purchase</li>
            <li>Supply to you services that you purchase</li>
            <li>Send you statements and invoices</li>
            <li>Collect payments from you</li>
            <li>Send you marketing communications</li>
          </ul>
          <p>
            Where AL-FANAR discloses your personal information to its agents or sub-contractors for 
            these purposes, the agent or sub-contractor in question will be obligated to use that 
            personal information in accordance with the terms of this privacy statement.
          </p>
          <p>
            In addition to the disclosures reasonably necessary for the purposes identified elsewhere 
            above, AL-FANAR may disclose your personal information to the extent that it is required 
            to do so by law, in connection with any legal proceedings or prospective legal proceedings, 
            and in order to establish, exercise or defend its legal rights.
          </p>
        </section>

        <section>
          <h2>Securing Your Data</h2>
          <p>
            AL-FANAR will take reasonable technical and organizational precautions to prevent the 
            loss, misuse, or alteration of your personal information.
          </p>
          <p>AL-FANAR will store all the personal information you provide on its secure servers.</p>
          <p>
            Information relating to electronic transactions entered into via this website will be 
            protected by encryption technology.
          </p>
        </section>

        <section>
          <h2>Cross-Border Data Transfers</h2>
          <p>
            Information that AL-FANAR collects may be stored and processed in and transferred between 
            any of the countries in which AL-FANAR operates to enable the use of the information in 
            accordance with this privacy policy.
          </p>
          <p>
            In addition, personal information that you submit for publication on the website will be 
            published on the internet and may be available around the world.
          </p>
          <p>You agree to such cross-border transfers of personal information.</p>
        </section>

        <section>
          <h2>Updating This Statement</h2>
          <p>
            AL-FANAR may update this privacy policy by posting a new version on this website. 
            You should check this page occasionally to ensure you are familiar with any changes.
          </p>
        </section>

        <section>
          <h2>Other Websites</h2>
          <p>
            This website contains links to other websites. AL-FANAR is not responsible for the 
            privacy policies or practices of any third party.
          </p>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p>
            We are always pleased to hear from our customers even if it is a complaint. We want to 
            ensure our customers are always satisfied with their purchase and to return to the site 
            and to recommend us to friends and family. If you have any questions or feedback, or if 
            you would like us to stop processing your information, please do not hesitate to contact 
            our customer care team who will be happy to answer any questions you may have.
          </p>
          
          <div className="contact-details">
            <p>
              <strong>Email:</strong> <a href="mailto:info@alfanar.store">info@alfanar.store</a>
            </p>
            <p>
              <strong>Phone:</strong> <a href="tel:+96597210352">+965 97210352</a>
            </p>
          </div>

          <div className="contact-address">
            <p><strong>Mailing Address:</strong></p>
            <p>AL-FANAR</p>
            <p> Al Hamra Tower & Mall</p>
            <p>Al-Shuhada St</p>
            <p>Kuwait City 13010, Kuwait</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
