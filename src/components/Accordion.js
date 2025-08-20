import React, { useState } from 'react';
import IconStrategy from './IconStrategy';
import IconDesign from './IconDesign';
import IconCode from './IconCode';
import IconOptimization from './IconOptimization';
import './accordion.scss'; // Import the styles for the component

const AccordionItem = ({ icon: Icon, title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="accordion-item">
      <div className="accordion-header" onClick={toggleOpen}>
        <Icon className="accordion-icon" />
        <h3 className="accordion-title">{title}</h3>
      </div>
      {isOpen && <div className="accordion-content">{children}</div>}
    </div>
  );
};

const Accordion = () => {
  return (
    <div className="accordion">
      <AccordionItem icon={IconStrategy} title="Strategy">
        <p>Start with why and develop a high-level plan for how.</p>
      </AccordionItem>
      <AccordionItem icon={IconDesign} title="Design">
        <p>Description for design services.</p>
      </AccordionItem>
      <AccordionItem icon={IconCode} title="Websites & web apps">
        <p>Description for websites and web apps.</p>
      </AccordionItem>
      <AccordionItem icon={IconOptimization} title="Optimization">
        <p>Description for optimization services.</p>
      </AccordionItem>
    </div>
  );
};

export default Accordion;
