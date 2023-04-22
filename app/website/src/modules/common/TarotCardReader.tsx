/* Created by Twitch chatter ChatJOEPT, design a tarot card reader and find a website with actual tarot card images and use them in the component. the component should display a 1 row grid with 7 columns, 1 card per column, with its image, name, and description; all of this information should be sourced from the website that you find and scrape. We can press a button to reveal 7 new cards. */

import React, { useState } from 'react';
import { Button, Card, CardActionArea, CardContent, CardMedia, Grid, Typography } from '@mui/material';

const TarotCardReader = () => {
  const [cards, setCards] = useState([] as {
    imgSrc: string | undefined;
    name: string | undefined;
    description: string | undefined;
  }[]);

  const fetchCards = async () => {
    const response = await fetch('https://www.tarotcardguide.com/');
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const cardElements = doc.querySelectorAll('.card');
    const newCards = Array.from(cardElements).map((element) => {
      const imgSrc = element.querySelector('img')?.src;
      const name = element.querySelector('h4')?.innerText;
      const description = element.querySelector('p')?.innerText;
      return { imgSrc, name, description };
    });
    setCards(newCards);
  };

  const handleFetchCards = () => {
    void fetchCards();
  };

  return (
    <>
      <Button variant="contained" onClick={handleFetchCards}>Draw Cards</Button>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {[...Array(7).keys()].map((index) => (
          <Grid item xs={12} md={2} key={index}>
            {cards[index] && (
              <Card>
                <CardActionArea>
                  <CardMedia
                    component="img"
                    height="300"
                    image={cards[index].imgSrc}
                    alt={cards[index].name}
                  />
                  <CardContent>
                    <Typography variant="h6">{cards[index].name}</Typography>
                    <Typography variant="body2" color="textSecondary">{cards[index].description}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            )}
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default TarotCardReader;
