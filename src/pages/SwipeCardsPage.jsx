import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Container } from "@mui/material";
import SwipeableViews from "react-swipeable-views-react-18-fix";
import { useParams } from "react-router-dom";

import Header from "../Components/SliderCards/Header";
import ProgressIndicator from "../Components/SliderCards/ProgressIndicator";
import CardSlide from "../Components/SliderCards/CardSlide";
import QuizSlide from "../Components/SliderCards/QuizSlide";
import NavigationButtons from "../Components/SliderCards/NavigationButtons";

const findAsset = (data, courseId, assetId) => {
  const courseData = data.find((course) => course.id === courseId);
  const asset = courseData?.assets.find((asset) => asset.id === assetId);
  return { asset };
};

const SwipeCards = ({ data }) => {
  const { courseId, assetId, lessonId } = useParams();
  const { asset } = findAsset(data, courseId, assetId);

  const theme = useTheme();

  const assetCards = asset.cards;
  const cardsArray = assetCards[lessonId].cards;
  const questionsArray = assetCards[lessonId].testQuestions;

  const maxSteps = cardsArray.length + 1; // +1 for the quiz slide
  const progressKey = `${courseId}-${assetId}-${lessonId}-progress`;

  const [activeStep, setActiveStep] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(
    Array(questionsArray.length).fill(null)
  );
  const [showResults, setShowResults] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    const progress = JSON.parse(localStorage.getItem(progressKey)) || {};
    const initialStep =
      progress.peakProgress === 100
        ? 0
        : progress.currentStep !== undefined
        ? progress.currentStep
        : 0;
    setActiveStep(initialStep);
    setCurrentQuestion(0);
    setAnswers(Array(questionsArray.length).fill(null));
    setShowResults(false);
    setValidationMessage("");
  }, [courseId, assetId, lessonId]);

  // Save the current slide progress separately
  const saveCurrentProgress = (currentStep) => {
    const existingProgress =
      JSON.parse(localStorage.getItem(progressKey)) || {};
    const updatedProgress = {
      ...existingProgress,
      currentStep,
    };
    localStorage.setItem(progressKey, JSON.stringify(updatedProgress));
  };

  // Update saveProgress to not overwrite current step:
  const saveProgress = (progress, score) => {
    const existingProgress =
      JSON.parse(localStorage.getItem(progressKey)) || {};
    const updatedProgress = {
      ...existingProgress,
      peakProgress: Math.max(existingProgress.peakProgress || 0, progress),
      peakScore: Math.max(existingProgress.peakScore || 0, score),
      lastScore: score,
    };
    localStorage.setItem(progressKey, JSON.stringify(updatedProgress));
  };

  const handleNext = () => {
    if (activeStep < maxSteps - 1) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } else if (!showResults) {
      if (answers[currentQuestion] === null) {
        setValidationMessage("Выберите ответ для продолжения");
      } else if (currentQuestion < questionsArray.length - 1) {
        setValidationMessage("");
        setCurrentQuestion((prevQuestion) => prevQuestion + 1);
      } else {
        setValidationMessage("");
        setShowResults(true);
        saveProgress((activeStep / (maxSteps - 1)) * 100, calculateResults());
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    }
  };

  const handleStepChange = (step) => {
    setActiveStep(step);
  };

  const handleAnswerChange = (event, index) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestion] = index;
    setAnswers(updatedAnswers);
    setValidationMessage("");
  };

  const calculateResults = () => {
    let correctAnswers = 0;
    questionsArray.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers += 1;
      }
    });
    return correctAnswers;
  };

  // Возврат к слайду с вопросами, а не к последнему слайду cardsArray, если вышел со слайда с
  useEffect(() => {
    saveCurrentProgress(activeStep);
    if (activeStep < maxSteps - 1) {
      const progress = (activeStep / (maxSteps - 1)) * 100;
      saveProgress(progress, calculateResults());
    }
  }, [activeStep]);

  return (
    <div>
      <Container>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            paddingTop: "10%",
            paddingBottom: "5%",
            justifyContent: "space-around",
          }}
        >
          <Header courseId={courseId} title={assetCards[lessonId].title} />
          <Box>
            <ProgressIndicator activeStep={activeStep} maxSteps={maxSteps} />
            <SwipeableViews
              axis={theme.direction === "rtl" ? "x-reverse" : "x"}
              index={activeStep}
              onChangeIndex={handleStepChange}
              enableMouseEvents
              style={{
                position: "relative",
              }}
            >
              {cardsArray.map((step, index) => (
                <CardSlide
                  key={index}
                  step={step}
                  activeStep={activeStep}
                  index={index}
                />
              ))}
              <QuizSlide
                questionsArray={questionsArray}
                currentQuestion={currentQuestion}
                answers={answers}
                handleAnswerChange={handleAnswerChange}
                handleNext={handleNext}
                validationMessage={validationMessage}
                showResults={showResults}
                calculateResults={calculateResults}
              />
            </SwipeableViews>
          </Box>

          <NavigationButtons
            handleBack={handleBack}
            handleNext={handleNext}
            activeStep={activeStep}
            maxSteps={maxSteps}
          />
        </Box>
      </Container>
    </div>
  );
};

export default SwipeCards;
