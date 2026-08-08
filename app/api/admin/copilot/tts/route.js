import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text } = await request.json();
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY is not configured in environment variables.' },
        { status: 500 }
      );
    }

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Antoni voice ID (A realistic male voice suitable for Orlo)
    const voiceId = 'ErXwobaYiN019PkySvjV';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5', // Use turbo model for lowest latency
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs API Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate speech from ElevenLabs.', details: errorData },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
