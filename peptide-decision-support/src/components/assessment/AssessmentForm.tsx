"use client";

import { useMemo, useState } from "react";
import { bloodworkFields } from "@/lib/data/functionalBloodwork";
import { baselineLabs } from "@/lib/data/labPanels";
import { goalOptions } from "@/lib/data/options";
import { createAssessment } from "@/server/actions";

const redFlags = [
  ["pregnancy", "Are you pregnant, trying to conceive, or breastfeeding?"],
  ["mtcMen2", "Do you have a personal or family history of medullary thyroid carcinoma or MEN2?"],
  ["pancreatitis", "Do you have a history of pancreatitis?"],
  ["gallbladderDisease", "Do you have active or significant gallbladder disease?"],
  ["cancerHistory", "Do you have current or past cancer history?"],
  ["uncontrolledDiabetesHypoglycemia", "Do you have uncontrolled diabetes or recurrent hypoglycemia?"],
  ["kidneyDisease", "Do you have kidney disease or reduced kidney function?"],
  ["liverDisease", "Do you have liver disease or abnormal liver enzymes?"],
  ["activeInfection", "Do you have an active infection?"],
  ["autoimmuneCondition", "Do you have an autoimmune condition?"],
  ["activeEatingDisorder", "Do you have a diagnosed eating disorder or current binge/restrict cycle?"],
  ["psychiatricInstability", "Do you have unstable anxiety, depression, bipolar disorder, mania, psychosis, or recent psychiatric medication changes?"],
  ["researchPeptideUse", "Are you currently using non-prescribed peptides, research chemicals, or injectable compounds?"]
];

const medications = [
  ["insulin", "Insulin"],
  ["sulfonylureas", "Sulfonylureas"],
  ["metformin", "Metformin"],
  ["sglt2", "SGLT2 inhibitors"],
  ["glp1Gip", "GLP-1/GIP medications"],
  ["antihypertensives", "Blood pressure medications"],
  ["anticoagulants", "Anticoagulants/blood thinners"],
  ["immunosuppressants", "Immunosuppressants"],
  ["corticosteroids", "Corticosteroids"],
  ["thyroidMedication", "Thyroid medication"],
  ["hormoneTherapy", "Testosterone, estrogen, progesterone, DHEA, enclomiphene, clomiphene, anastrozole, or hormone therapy"],
  ["stimulantsAdhd", "Stimulants or ADHD medications"],
  ["ssriSnri", "SSRIs/SNRIs"],
  ["benzodiazepines", "Benzodiazepines"],
  ["moodStabilizersAntipsychotics", "Mood stabilizers or antipsychotics"]
];

export function AssessmentForm() {
  const [accepted, setAccepted] = useState(false);
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [secondaryGoals, setSecondaryGoals] = useState<string[]>([]);
  const secondaryChoices = useMemo(() => goalOptions.filter((goal) => goal.key !== primaryGoal), [primaryGoal]);
  const bloodworkGroups = useMemo(() => {
    return bloodworkFields.reduce<Record<string, typeof bloodworkFields>>((groups, field) => {
      groups[field.group] = [...(groups[field.group] ?? []), field];
      return groups;
    }, {});
  }, []);

  function toggleSecondary(goal: string) {
    setSecondaryGoals((current) => {
      if (current.includes(goal)) return current.filter((item) => item !== goal);
      if (current.length >= 2) return current;
      return [...current, goal];
    });
  }

  return (
    <form className="form" action={createAssessment} encType="multipart/form-data">
      <section className="step">
        <p className="eyebrow">Boundary</p>
        <h2>Welcome</h2>
        <div className="notice">
          This assessment does not prescribe medication or peptides. It helps organize your goals, medical history, medications,
          lab needs, and risk factors so you can have a more informed discussion with a licensed medical provider.
        </div>
        <label className="choice">
          <input required type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
          <span>I understand this tool does not provide medical diagnosis, prescription, or dosing advice.</span>
        </label>
      </section>

      <section className="step">
        <p className="eyebrow">Client</p>
        <h2>Contact</h2>
        <div className="grid">
          <div className="field">
            <label htmlFor="firstName">First name</label>
            <input id="firstName" name="firstName" required type="text" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" required type="email" />
          </div>
          <div className="field">
            <label htmlFor="ageRange">Age range</label>
            <select id="ageRange" name="ageRange" required defaultValue="">
              <option value="" disabled>
                Select
              </option>
              <option>18-29</option>
              <option>30-39</option>
              <option>40-49</option>
              <option>50-59</option>
              <option>60-69</option>
              <option>70+</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sexAtBirth">Sex at birth</label>
            <select id="sexAtBirth" name="sexAtBirth" defaultValue="">
              <option value="">Prefer not to say</option>
              <option>Female</option>
              <option>Male</option>
              <option>Intersex</option>
            </select>
          </div>
        </div>
      </section>

      <section className="step">
        <p className="eyebrow">Goals</p>
        <h2>Primary goal</h2>
        <div className="grid">
          {goalOptions.map((goal) => (
            <label className="choice" key={goal.key}>
              <input required type="radio" name="primaryGoal" value={goal.key} checked={primaryGoal === goal.key} onChange={() => setPrimaryGoal(goal.key)} />
              <span>{goal.label}</span>
            </label>
          ))}
        </div>
        <h3>Secondary goals</h3>
        <p className="muted small">Optional. Choose up to two.</p>
        <div className="grid">
          {secondaryChoices.map((goal) => (
            <label className="choice" key={goal.key}>
              <input
                type="checkbox"
                name="secondaryGoals"
                value={goal.key}
                checked={secondaryGoals.includes(goal.key)}
                disabled={!secondaryGoals.includes(goal.key) && secondaryGoals.length >= 2}
                onChange={() => toggleSecondary(goal.key)}
              />
              <span>{goal.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="step">
        <p className="eyebrow">Safety</p>
        <h2>Red flags</h2>
        <div className="notice warn">
          If you are experiencing severe abdominal pain, chest pain, shortness of breath, fainting, severe allergic reaction,
          suicidal thoughts, or other urgent symptoms, seek urgent medical care.
        </div>
        <div className="grid">
          {redFlags.map(([key, label]) => (
            <label className="choice" key={key}>
              <input type="checkbox" name={key} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="step">
        <p className="eyebrow">Medication review</p>
        <h2>Current medications</h2>
        <div className="grid">
          {medications.map(([key, label]) => (
            <label className="choice" key={key}>
              <input type="checkbox" name={key} />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <div className="field">
          <label htmlFor="otherMedications">Other medications</label>
          <textarea id="otherMedications" name="otherMedications" rows={3} />
        </div>
      </section>

      <section className="step">
        <p className="eyebrow">Labs</p>
        <h2>Lab availability</h2>
        <div className="grid">
          <label className="choice">
            <input required type="radio" name="hasRecentLabs" value="yes_upload" />
            <span>Yes, I can upload them.</span>
          </label>
          <label className="choice">
            <input required type="radio" name="hasRecentLabs" value="yes_manual" />
            <span>Yes, I can enter values manually.</span>
          </label>
          <label className="choice">
            <input required type="radio" name="hasRecentLabs" value="no" />
            <span>No, I need baseline labs.</span>
          </label>
          <label className="choice">
            <input required type="radio" name="hasRecentLabs" value="unsure" />
            <span>I’m not sure.</span>
          </label>
        </div>
        <h3>Available baseline items</h3>
        <div className="grid">
          {baselineLabs.map((lab) => (
            <label className="choice" key={lab}>
              <input type="checkbox" name="availableLabs" value={lab} />
              <span>{lab}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="step">
        <p className="eyebrow">Blood work</p>
        <h2>Upload lab report</h2>
        <p className="muted small">
          Preferred. Upload a text-based PDF, CSV, TXT, or HTML lab export. Scanned image PDFs may need manual entry because they require OCR.
        </p>
        <div className="field">
          <label htmlFor="labReport">Lab report file</label>
          <input
            accept=".pdf,.csv,.tsv,.txt,.html,.htm,application/pdf,text/plain,text/csv,text/html"
            id="labReport"
            name="labReport"
            type="file"
          />
        </div>
      </section>

      <section className="step">
        <p className="eyebrow">Corrections</p>
        <h2>Manual overrides</h2>
        <p className="muted small">Optional. Enter values here only when an upload misses or misreads a marker; these values override the uploaded extraction.</p>
        <div className="stack">
          {Object.entries(bloodworkGroups).map(([group, fields]) => (
            <div className="lab-group" key={group}>
              <h3>{group}</h3>
              <div className="grid">
                {fields.map((field) => (
                  <div className="field" key={field.key}>
                    <label htmlFor={`bloodwork_${field.key}`}>{field.label}</label>
                    <div className="unit-input">
                      <input
                        id={`bloodwork_${field.key}`}
                        name={`bloodwork_${field.key}`}
                        min={0}
                        placeholder={field.placeholder}
                        step={field.step ?? "0.1"}
                        type="number"
                      />
                      <span>{field.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="step">
        <p className="eyebrow">Readiness</p>
        <h2>Lifestyle and tracking</h2>
        <div className="grid">
          <div className="field">
            <label htmlFor="resistanceTrainingDays">Resistance training days per week</label>
            <input id="resistanceTrainingDays" name="resistanceTrainingDays" min={0} max={7} required type="number" />
          </div>
          <div className="field">
            <label htmlFor="proteinGrams">Average protein grams per day</label>
            <input id="proteinGrams" name="proteinGrams" min={0} type="number" />
          </div>
          <div className="field">
            <label htmlFor="sleepHours">Sleep hours per night</label>
            <input id="sleepHours" name="sleepHours" min={0} max={14} step="0.5" required type="number" />
          </div>
        </div>
        <div className="grid">
          <label className="choice"><input type="checkbox" name="tracksBodyMetrics" /> <span>I track weight, waist, or body composition.</span></label>
          <label className="choice"><input type="checkbox" name="hasNutritionPlan" /> <span>I currently have a structured nutrition plan.</span></label>
          <label className="choice"><input type="checkbox" name="hasDiagnosedInjury" /> <span>I have a diagnosed injury instead of guessing.</span></label>
          <label className="choice"><input type="checkbox" name="willingBaselineLabs" /> <span>I am willing to complete baseline labs before provider review.</span></label>
          <label className="choice"><input type="checkbox" name="willingTrackOutcomes" /> <span>I am willing to track outcomes for 8-12 weeks.</span></label>
        </div>
      </section>

      <button className="button" disabled={!accepted || !primaryGoal} type="submit">
        Generate Report
      </button>
    </form>
  );
}
