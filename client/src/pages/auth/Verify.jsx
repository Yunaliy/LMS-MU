import React, { useState, useRef, useEffect } from "react";
import "./auth.css";
import { Link, useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";
import ReCAPTCHA from "react-google-recaptcha";

const Verify = () => {
  const [otp, setOtp] = useState(new Array(6).fill("")); // State for 6 individual OTP digits
  const { btnLoading, verifyOtp } = UserData();
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const navigate = useNavigate();
  const inputRefs = useRef([]); // Refs for managing focus on inputs

  useEffect(() => {
    // Set focus to the first input on component mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  function onChange(value) {
    if (value) {
      setCaptchaVerified(true);
    }
  }

  const handleInputChange = (index, e) => {
    const { value } = e.target;
    // Only allow single digits
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      // Update the current digit
      newOtp[index] = value.slice(-1); // Take only the last character
      setOtp(newOtp);

      // Move focus to the next input if a digit was entered and it's not the last input
      if (value && index < 5) {
        inputRefs.current[index + 1].focus();
      } else if (!value && index > 0) {
         // Optionally move focus to previous input on backspace from empty field
        // This requires handling the keydown event for backspace more specifically
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Move focus to the previous input on backspace if current field is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };


  const submitHandler = async (e) => {
    e.preventDefault();

    if (!captchaVerified) {
      console.error("Please complete the reCAPTCHA.");
      return;
    }

    // Join the individual digits to form the complete OTP string
    const completeOtp = otp.join("");

    // Basic check if all fields are filled (optional depending on desired behavior)
    if (completeOtp.length !== 6) {
        console.error("Please enter the complete 6-digit OTP.");
        // Optionally set an error state to display this to the user
        return;
    }

    await verifyOtp(Number(completeOtp), navigate); // Convert to number if your verifyOtp function expects a number
  };
  
  return (
    <div className="container"> 
      <div className="row justify-content-center align-items-center min-vh-100"> 
        <div className="col-md-6 col-lg-4"> 
          <div className="card shadow"> 
            <div className="card-body p-5"> 
              <h2 className="text-center mb-4">Verify Account</h2> 
              
              <form onSubmit={submitHandler}> 
                <div className="mb-3">
                  <label htmlFor="otp" className="form-label">OTP Code</label>
                   <div className="otp-inputs-container"> {/* Container for OTP inputs */}
                     {otp.map((digit, index) => (
                       <input
                         key={index}
                         type="text" // Use text type for easier handling of single digits
                         className="otp-input form-control" // Add specific OTP class and form-control
                         id={`otp-${index}`}
                         value={digit}
                         onChange={(e) => handleInputChange(index, e)}
                         onKeyDown={(e) => handleKeyDown(index, e)}
                         maxLength="1" // Limit to one digit
                         required
                         ref={(el) => inputRefs.current[index] = el} // Assign ref
                       />
                     ))}
                   </div>
                </div>

                <div className="mb-3">
                  <ReCAPTCHA
                    sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" 
                    onChange={onChange}
                  />
                </div>

                <div className="d-grid gap-2"> 
                  <button disabled={btnLoading || !captchaVerified || otp.join("").length !== 6} type="submit" className="btn btn-primary"> 
                    {btnLoading ? "Please Wait..." : "Verify"}
                  </button>
                </div>
              </form>

              <div className="text-center mt-3"> 
                <p className="mb-0">
                  Go to <Link to="/login" className="text-decoration-none">Login</Link> page
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
